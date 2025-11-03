import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { scheduleQuerySchema } from "@/lib/validators/schedule";

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
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    console.error("List schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
