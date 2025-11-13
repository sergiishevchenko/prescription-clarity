import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  createMedicationSchema,
  type CreateMedicationInput,
} from "@/lib/validators/medication";
// Derive the exact where input type from the Prisma client
type MedicationWhere = NonNullable<
  Parameters<typeof prisma.medication.findMany>[0]
>["where"];

export const runtime = "nodejs";

/**
 * GET /api/medications
 * Get all medications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // optional: filter by ACTIVE/DELETED

    // Build where clause
    const where: MedicationWhere = {
      userId: user.id,
    };

    if (status === "ACTIVE" || status === "DELETED") {
      where.status = status;
    } else {
      // By default, only return ACTIVE medications
      where.status = "ACTIVE";
    }

    // Fetch medications
    const medications = await prisma.medication.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json({ medications }, { status: 200 });
  } catch (error) {
    console.error("GET /api/medications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/medications
 * Create a new medication for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: CreateMedicationInput =
      createMedicationSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 },
      );
    }

    // Check for duplicate medication (same name and dose)
    const existingMedication = await prisma.medication.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        dose: {
          equals: validatedData.dose,
          mode: "insensitive",
        },
        status: "ACTIVE",
      },
    });

    if (existingMedication) {
      return NextResponse.json(
        { error: "Medication with this name and dose already exists" },
        { status: 409 },
      );
    }

    // Create medication
    const medication = await prisma.medication.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        dose: validatedData.dose,
        frequency: validatedData.frequency,
        startDate,
        endDate,
        status: "ACTIVE",
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

    // Revalidate medications data consumers
    try {
      revalidateTag("medications", "max");
    } catch {}
    return NextResponse.json({ medication }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("POST /api/medications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
