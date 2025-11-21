import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  searchMedicationSchema,
  type SearchMedicationInput,
} from "@/lib/validators/medication";

export const runtime = "nodejs";

/**
 * POST /api/medications/search
 * Search medications by name for the authenticated user
 * Returns full medication model except id and userId
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
    const validatedData: SearchMedicationInput =
      searchMedicationSchema.parse(body);

    // Search medications by name prefix (case-insensitive)
    const medications = await prisma.medication.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        name: {
          startsWith: validatedData.name,
          mode: "insensitive",
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        dose: true,
        form: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ medications }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("POST /api/medications/search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
