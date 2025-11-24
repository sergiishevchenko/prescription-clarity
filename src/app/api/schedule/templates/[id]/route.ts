import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { updateScheduleSchema } from "@/lib/validators/schedule";
import { generateScheduleEntries } from "@/app/api/schedule/generate/route";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const existing = await prisma.schedule.findFirst({
      where: { id, userId: user.id },
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
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const payload = updateScheduleSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (payload.quantity !== undefined) {
      updateData.quantity = payload.quantity;
    }
    if (payload.units !== undefined) {
      updateData.units = payload.units;
    }
    if (payload.frequencyDays !== undefined) {
      updateData.frequencyDays = payload.frequencyDays;
    }
    if (payload.timeOfDay !== undefined) {
      updateData.timeOfDay = payload.timeOfDay;
    }
    if (payload.mealTiming !== undefined) {
      updateData.mealTiming = payload.mealTiming;
    }
    if (payload.durationDays !== undefined) {
      updateData.durationDays = payload.durationDays;
    }

    let dateStartToApply: Date | undefined;
    if (payload.dateStart !== undefined) {
      dateStartToApply = new Date(`${payload.dateStart}T00:00:00.000Z`);
      updateData.dateStart = dateStartToApply;
    }

    if (payload.dateStart !== undefined || payload.durationDays !== undefined) {
      const baseStart = dateStartToApply ?? existing.dateStart;
      const duration =
        payload.durationDays !== undefined
          ? payload.durationDays
          : existing.durationDays;

      let computedEnd: Date | null = null;
      if (duration > 0) {
        computedEnd = new Date(baseStart);
        computedEnd.setDate(computedEnd.getDate() + duration);
      }
      updateData.dateEnd = computedEnd;
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: updateData,
      include: {
        medication: {
          select: { id: true, name: true, dose: true, form: true },
        },
      },
    });

    const shouldRegenerate = payload.regenerateEntries ?? true;
    if (shouldRegenerate) {
      const now = new Date();
      await prisma.scheduleEntry.deleteMany({
        where: {
          scheduleId: updated.id,
          userId: user.id,
          dateTime: {
            gte: now,
          },
        },
      });
      await generateScheduleEntries(updated.id, user.id);
    }

    const responsePayload = {
      id: updated.id,
      medicationId: updated.medicationId,
      userId: updated.userId,
      quantity: updated.quantity,
      units: updated.units,
      frequencyDays: updated.frequencyDays as number[],
      durationDays: updated.durationDays,
      dateStart: updated.dateStart.toISOString(),
      dateEnd: updated.dateEnd ? updated.dateEnd.toISOString() : null,
      timeOfDay: updated.timeOfDay as string[],
      mealTiming: updated.mealTiming,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      medication: updated.medication,
    };

    return NextResponse.json({ schedule: responsePayload });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("Update schedule template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
