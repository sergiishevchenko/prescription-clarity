import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  updateMedicationSchema,
  type UpdateMedicationInput,
} from "@/lib/validators/medication";
import {
  deleteMedicationWithCleanup,
  createMedicationVersion,
} from "@/lib/medication-service";
import { updateDayStatusesForDates } from "@/lib/day-status";
import type { Prisma } from "@prisma/client";

// Derive the exact update input type from Prisma
type MedicationUpdateData = Prisma.MedicationUpdateInput;

export const runtime = "nodejs";

/**
 * GET /api/medications/[id]
 * Get a single medication by ID (only if it belongs to the authenticated user)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch medication
    const medication = await prisma.medication.findFirst({
      where: {
        id,
        userId: user.id, // Ensure the medication belongs to the user
        deletedAt: null, // Only return non-deleted medications
      },
      select: {
        id: true,
        name: true,
        dose: true,
        form: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 },
      );
    }

    try {
      revalidateTag("medications", "max");
    } catch {}
    return NextResponse.json({ medication }, { status: 200 });
  } catch (error) {
    console.error("GET /api/medications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/medications/[id]
 * Update a medication by ID (only if it belongs to the authenticated user)
 *
 * If createVersion is true:
 * 1. Soft delete the previous medication version
 * 2. Delete future PLANNED schedule entries
 * 3. Create a new medication version with previousMedicationId link
 *
 * If createVersion is false (default):
 * Simple in-place update of the medication fields
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if medication exists and belongs to user
    const existingMedication = await prisma.medication.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only update non-deleted medications
      },
    });

    if (!existingMedication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: UpdateMedicationInput =
      updateMedicationSchema.parse(body);

    // Get timezone from query params (optional, defaults to UTC)
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("tz") || "UTC";

    // Check if medication has an active schedule
    const hasActiveSchedule = await prisma.schedule.findFirst({
      where: {
        medicationId: id,
        userId: user.id,
        deletedAt: null,
      },
    });

    // Use versioning flow if:
    // 1. createVersion is explicitly true, OR
    // 2. The medication has an active schedule (to maintain history consistency)
    const shouldVersion =
      validatedData.createVersion === true || hasActiveSchedule !== null;

    if (shouldVersion) {
      try {
        const versionResult = await createMedicationVersion(
          id,
          {
            name: validatedData.name ?? existingMedication.name,
            dose: validatedData.dose ?? existingMedication.dose,
            form: validatedData.form ?? existingMedication.form,
          },
          user.id,
        );

        // Update day status cache for affected dates
        if (versionResult.affectedDates.length > 0) {
          updateDayStatusesForDates(
            user.id,
            versionResult.affectedDates,
            timezone,
          ).catch((error) => {
            console.error(
              "Failed to update day status cache after medication version:",
              error,
            );
          });
        }

        try {
          revalidateTag("medications", "max");
        } catch {}

        return NextResponse.json(
          {
            medication: {
              id: versionResult.newMedication.id,
              name: versionResult.newMedication.name,
              dose: versionResult.newMedication.dose,
              form: versionResult.newMedication.form,
              previousMedicationId:
                versionResult.newMedication.previousMedicationId,
              createdAt: versionResult.newMedication.createdAt,
              updatedAt: versionResult.newMedication.updatedAt,
            },
            isNewVersion: true,
            previousMedicationId: id,
            deletedScheduleEntries: versionResult.deletedEntriesCount,
            generatedScheduleEntries: versionResult.generatedEntriesCount,
            newScheduleId: versionResult.newSchedule?.id ?? null,
          },
          { status: 200 },
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Medication not found"
        ) {
          return NextResponse.json(
            { error: "Medication not found" },
            { status: 404 },
          );
        }
        throw error;
      }
    }

    // Simple in-place update (no versioning) - only for medications without schedules
    const updateData: MedicationUpdateData = {} as MedicationUpdateData;

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.dose !== undefined) {
      updateData.dose = validatedData.dose;
    }
    if (validatedData.form !== undefined) {
      updateData.form = validatedData.form;
    }

    // Update medication
    const medication = await prisma.medication.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        dose: true,
        form: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    try {
      revalidateTag("medications", "max");
    } catch {}

    return NextResponse.json(
      { medication, isNewVersion: false },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("PATCH /api/medications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/medications/[id]
 * Soft delete a medication by ID with full cleanup:
 * 1. Soft delete the medication
 * 2. Soft delete related schedules
 * 3. Delete future PLANNED schedule entries
 * 4. Update day status cache
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get timezone from query params (optional, defaults to UTC)
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("tz") || "UTC";

    // Perform full delete with cleanup
    const result = await deleteMedicationWithCleanup(id, user.id, timezone);

    if (!result.success) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 },
      );
    }

    try {
      revalidateTag("medications", "max");
    } catch {}

    return NextResponse.json(
      {
        message: "Medication deleted successfully",
        deletedScheduleEntries: result.deletedEntriesCount,
        deletedSchedules: result.deletedSchedulesCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/medications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
