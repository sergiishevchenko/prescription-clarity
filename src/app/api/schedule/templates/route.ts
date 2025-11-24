import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const templates = await prisma.schedule.findMany({
      where: { userId: user.id },
      include: {
        medication: {
          select: {
            id: true,
            name: true,
            dose: true,
            form: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = templates.map((schedule) => ({
      id: schedule.id,
      medicationId: schedule.medicationId,
      userId: schedule.userId,
      quantity: schedule.quantity,
      units: schedule.units,
      frequencyDays: schedule.frequencyDays as number[],
      durationDays: schedule.durationDays,
      dateStart: schedule.dateStart.toISOString(),
      dateEnd: schedule.dateEnd ? schedule.dateEnd.toISOString() : null,
      timeOfDay: schedule.timeOfDay as string[],
      mealTiming: schedule.mealTiming,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      medication: schedule.medication,
    }));

    return NextResponse.json({ items: result });
  } catch (error) {
    console.error("List schedule templates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
