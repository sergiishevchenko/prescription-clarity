import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { updateScheduleSchema } from "@/lib/validators/schedule";
import { generateScheduleEntries } from "@/app/api/schedule/generate/route";
import { updateDayStatusesForDates } from "@/lib/day-status";

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
      where: {
        id,
        userId: user.id,
        deletedAt: null, // Only allow editing non-deleted schedules
        medication: {
          deletedAt: null, // Only for non-deleted medications
        },
      },
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

/**
 * DELETE /api/schedule/templates/[id]
 * Soft delete a schedule and remove future PLANNED entries
 * Past entries are preserved for history
 */
export async function DELETE(
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

    // Get timezone from query params (optional, defaults to UTC)
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get("tz") || "UTC";

    // Check if schedule exists and belongs to user
    const existing = await prisma.schedule.findFirst({
      where: {
        id,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();

    // Get future PLANNED entries for day status cache update
    const entriesToDelete = await prisma.scheduleEntry.findMany({
      where: {
        scheduleId: id,
        userId: user.id,
        dateTime: {
          gte: now,
        },
        status: "PLANNED",
      },
      select: {
        dateTime: true,
      },
    });

    // Extract unique dates for cache invalidation
    const affectedDates = Array.from(
      new Set(
        entriesToDelete.map((e) => {
          const d = new Date(e.dateTime);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        }),
      ),
    ).map((iso) => new Date(iso));

    // Delete future PLANNED entries
    const deleteResult = await prisma.scheduleEntry.deleteMany({
      where: {
        scheduleId: id,
        userId: user.id,
        dateTime: {
          gte: now,
        },
        status: "PLANNED",
      },
    });

    // Soft delete the schedule
    await prisma.schedule.update({
      where: { id },
      data: { deletedAt: now },
    });

    // Update day status cache for affected dates
    if (affectedDates.length > 0) {
      updateDayStatusesForDates(user.id, affectedDates, timezone).catch(
        (error) => {
          console.error(
            "Failed to update day status cache after schedule deletion:",
            error,
          );
        },
      );
    }

    return NextResponse.json({
      message: "Schedule deleted successfully",
      deletedEntries: deleteResult.count,
    });
  } catch (error) {
    console.error("Delete schedule template error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
