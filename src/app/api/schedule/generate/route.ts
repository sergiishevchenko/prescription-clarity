import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { generateScheduleSchema } from "@/lib/validators/schedule";

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
    userId: string;
    dateTime: Date;
  }[] = [];

  const start = new Date(schedule.dateStart);
  const end = schedule.dateEnd
    ? new Date(schedule.dateEnd)
    : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

  const frequencyDays = schedule.frequencyDays as number[];
  const timeOfDay = schedule.timeOfDay as string[];

  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dayOfWeek = getDayOfWeek(current);

    if (frequencyDays.includes(dayOfWeek)) {
      for (const timeStr of timeOfDay) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const entryDateTime = new Date(current);
        entryDateTime.setHours(hours, minutes, 0, 0);

        entries.push({
          scheduleId: schedule.id,
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
      const medication = await prisma.medication.findFirst({
        where: { id: medicationId, userId: user.id },
      });

      if (!medication) {
        return NextResponse.json(
          { error: "Medication not found" },
          { status: 404 },
        );
      }

      const frequencyHours = medication.frequency;
      if (frequencyHours <= 0) {
        return NextResponse.json(
          { error: "Medication frequency must be positive hours" },
          { status: 400 },
        );
      }

      const entries: {
        medicationId: string;
        userId: string;
        dateTime: Date;
      }[] = [];
      const start = new Date(medication.startDate);
      const end = new Date(medication.endDate);

      let current = new Date(start);
      while (current <= end) {
        entries.push({
          medicationId: medication.id,
          userId: user.id,
          dateTime: new Date(current),
        });
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
    } else {
      return NextResponse.json(
        { error: "Either scheduleId or medicationId must be provided" },
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
