import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  updateMedicationSchema,
  type UpdateMedicationInput,
} from "@/lib/validators/medication";
import type { Prisma } from "@prisma/client";

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
      },
      select: {
        id: true,
        name: true,
        dose: true,
        frequency: true,
        startDate: true,
        endDate: true,
        status: true,
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

    try { revalidateTag("medications", "max"); } catch {}
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
    const updateData: Prisma.MedicationUpdateInput = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.dose !== undefined) {
      updateData.dose = validatedData.dose;
    }
    if (validatedData.frequency !== undefined) {
      updateData.frequency = validatedData.frequency;
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    // Validate date range if both dates are present
    const finalStartDate = updateData.startDate || existingMedication.startDate;
    const finalEndDate = updateData.endDate || existingMedication.endDate;

    if (finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Update medication
    const medication = await prisma.medication.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        dose: true,
        frequency: true,
        startDate: true,
        endDate: true,
        status: true,
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
      },
    });

    if (!existingMedication) {
      return NextResponse.json(
        { error: "Medication not found" },
        { status: 404 },
      );
    }

    // Soft delete: update status to DELETED
    await prisma.medication.update({
      where: { id },
      data: {
        status: "DELETED",
      },
    });

    try { revalidateTag("medications", "max"); } catch {}
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
