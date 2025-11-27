import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { generateScheduleSchema } from "@/lib/validators/schedule";
import { updateDayStatusesForDates } from "@/lib/day-status";

export const runtime = "nodejs";

function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export async function generateScheduleEntries(
  scheduleId: string,
  userId: string,
): Promise<number> {
  const schedule = await prisma.schedule.findFirst({
    where: { id: scheduleId, userId },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const entries: {
    scheduleId: string;
    medicationId: string;
    userId: string;
    dateTime: Date;
  }[] = [];

  const start = new Date(schedule.dateStart);
  const end = schedule.dateEnd
    ? new Date(schedule.dateEnd)
    : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

  const frequencyDays = schedule.frequencyDays as number[];
  const timeOfDay = schedule.timeOfDay as string[];

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayOfWeek = getDayOfWeek(current);

    if (frequencyDays.includes(dayOfWeek)) {
      for (const timeStr of timeOfDay) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const entryDateTime = new Date(current);
        entryDateTime.setHours(hours, minutes, 0, 0);

        // For new schedules, generate all entries including past times today
        // (User may want to mark earlier doses as taken)
        entries.push({
          scheduleId: schedule.id,
          medicationId: schedule.medicationId,
          userId,
          dateTime: entryDateTime,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (entries.length === 0) {
    return 0;
  }

  const result = await prisma.scheduleEntry.createMany({
    data: entries,
    skipDuplicates: true,
  });

  // Update day status cache for all affected dates
  // Get unique dates from entries
  const uniqueDates = Array.from(
    new Set(
      entries.map((e) => {
        const d = new Date(e.dateTime);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }),
    ),
  ).map((iso) => new Date(iso));

  // Update statuses asynchronously (don't block response)
  updateDayStatusesForDates(userId, uniqueDates, "UTC").catch((error) => {
    console.error("Failed to update day status cache after generation:", error);
  });

  return result.count;
}

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
    const { medicationId, scheduleId } = generateScheduleSchema.parse(body);

    if (scheduleId) {
      try {
        const count = await generateScheduleEntries(scheduleId, user.id);
        return NextResponse.json({ created: count });
      } catch (error) {
        if (error instanceof Error && error.message === "Schedule not found") {
          return NextResponse.json(
            { error: "Schedule not found" },
            { status: 404 },
          );
        }
        throw error;
      }
    } else if (medicationId) {
      // NOTE: Medication-based schedule generation is deprecated
      // Medications no longer have frequency/startDate/endDate fields
      // Use Schedule model instead for scheduling functionality
      return NextResponse.json(
        {
          error:
            "Medication-based schedule generation is no longer supported. Please use Schedule model instead.",
        },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: "scheduleId must be provided" },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("Generate schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
