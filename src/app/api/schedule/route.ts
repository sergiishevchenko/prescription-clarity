import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { scheduleQuerySchema, createScheduleSchema, type CreateScheduleInput } from "@/lib/validators/schedule";
import { generateScheduleEntries } from "@/app/api/schedule/generate/route";

export const runtime = "nodejs";

function toLocalString(dateUtc: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(dateUtc)
    .replace(" ", "T");
  return parts;
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getSessionCookie();
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await verifySession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const tz = searchParams.get("tz") || "UTC";

    const validated = scheduleQuerySchema.parse({ from, to, tz });

    const fromDate = new Date(validated.from);
    const toDate = new Date(validated.to);

    const events = await prisma.scheduleEntry.findMany({
      where: {
        userId: user.id,
        dateTime: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        medication: {
          select: { id: true, name: true, dose: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    const result = events.map((e: (typeof events)[number]) => ({
      id: e.id,
      medicationId: e.medicationId,
      userId: e.userId,
      status: e.status,
      utcDateTime: e.dateTime.toISOString(),
      localDateTime: toLocalString(e.dateTime, validated.tz || "UTC"),
      medication: e.medication,
    }));

    return NextResponse.json({ items: result });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("List schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData: CreateScheduleInput = createScheduleSchema.parse(body);

    const dateStart = new Date(validatedData.dateStart + "T00:00:00.000Z");
    let dateEnd: Date | null = null;
    
    if (validatedData.durationDays > 0) {
      dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + validatedData.durationDays);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateStart < today) {
      return NextResponse.json(
        { error: "dateStart must be today or in the future" },
        { status: 400 },
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        medicineId: validatedData.medicineId,
        userId: user.id,
        quantity: validatedData.quantity,
        units: validatedData.units,
        frequencyDays: validatedData.frequencyDays,
        durationDays: validatedData.durationDays,
        dateStart,
        dateEnd,
        timeOfDay: validatedData.timeOfDay,
        mealTiming: validatedData.mealTiming,
      },
      select: {
        id: true,
        medicineId: true,
        userId: true,
        quantity: true,
        units: true,
        frequencyDays: true,
        durationDays: true,
        dateStart: true,
        dateEnd: true,
        timeOfDay: true,
        mealTiming: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    try {
      await generateScheduleEntries(schedule.id, user.id);
    } catch (error) {
      console.error("Error generating schedule entries:", error);
    }

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 },
      );
    }
    console.error("POST /api/schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
