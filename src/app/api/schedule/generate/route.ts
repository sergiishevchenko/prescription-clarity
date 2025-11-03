import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { generateScheduleSchema } from "@/lib/validators/schedule";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { medicationId } = generateScheduleSchema.parse(body);

    const medication = await prisma.medication.findFirst({
      where: { id: medicationId, userId: user.id },
    });

    if (!medication) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const frequencyHours = medication.frequency;
    if (frequencyHours <= 0) {
      return NextResponse.json(
        { error: "Medication frequency must be positive hours" },
        { status: 400 },
      );
    }

    const entries: { medicationId: string; userId: string; dateTime: Date }[] = [];
    const start = new Date(medication.startDate);
    const end = new Date(medication.endDate);

    let current = new Date(start);
    while (current <= end) {
      entries.push({ medicationId: medication.id, userId: user.id, dateTime: new Date(current) });
      current = new Date(current.getTime() + frequencyHours * 60 * 60 * 1000);
    }

    if (entries.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0 });
    }

    const result = await prisma.scheduleEntry.createMany({
      data: entries,
      skipDuplicates: true,
    });

    return NextResponse.json({ created: result.count });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    console.error("Generate schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
