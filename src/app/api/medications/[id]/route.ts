import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  updateMedicationSchema,
  type UpdateMedicationInput,
} from "@/lib/validators/medication";
// Derive the exact update input type from the Prisma client
type MedicationUpdateData = Parameters<
  typeof prisma.medication.update
>[0]["data"];

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

    // Build update data
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

    return NextResponse.json({ medication }, { status: 200 });
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
 * Soft delete a medication by ID (only if it belongs to the authenticated user)
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

    // Check if medication exists and belongs to user
    const existingMedication = await prisma.medication.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only delete non-deleted medications
      },
    });

    if (!existingMedication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 },
      );
    }

    // Soft delete: set deletedAt timestamp
    await prisma.medication.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    try {
      revalidateTag("medications", "max");
    } catch {}
    return NextResponse.json(
      { message: "Medication deleted successfully" },
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
