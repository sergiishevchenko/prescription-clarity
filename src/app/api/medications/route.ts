import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  createMedicationSchema,
  type CreateMedicationInput,
} from "@/lib/validators/medication";

export const runtime = "nodejs";

/**
 * GET /api/medications
 * Get medications for:
 * - the authenticated user (default), or
 * - a specific userId, if the authenticated user has care-access to that user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Determine which user's medications to load:
    // - If no userId is provided, use the authenticated user's ID (existing behavior)
    // - If userId is provided and differs from the current user, ensure we have care-access
    let targetUserId = user.id;

    if (requestedUserId && requestedUserId !== user.id) {
      const careAccess = await prisma.careAccess.findFirst({
        where: {
          ownerId: requestedUserId,
          viewerId: user.id,
        },
      });

      if (!careAccess) {
        return NextResponse.json(
          { error: "Forbidden: No access to this user's medications" },
          { status: 403 },
        );
      }

      targetUserId = requestedUserId;
    }

    // Build where clause - only return non-deleted medications
    const where = {
      userId: targetUserId,
      deletedAt: null,
    };

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
        form: true,
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

    // Check for duplicate medication (same name + dose + form for active medications)
    const existingMedication = await prisma.medication.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
        name: {
          equals: validatedData.name,
          mode: "insensitive",
        },
        dose: validatedData.dose,
        form: {
          equals: validatedData.form,
          mode: "insensitive",
        },
      },
    });

    if (existingMedication) {
      return NextResponse.json(
        { error: "Medication already exists" },
        { status: 409 },
      );
    }

    // Create medication
    const medication = await prisma.medication.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        ...(validatedData.dose !== undefined
          ? { dose: validatedData.dose }
          : {}),
        ...(validatedData.form !== undefined
          ? { form: validatedData.form }
          : {}),
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
