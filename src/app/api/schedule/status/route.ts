import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { getDayStatusesForRange } from "@/lib/day-status";
import { z } from "zod";

export const runtime = "nodejs";

const statusQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be YYYY-MM-DD"),
  tz: z.string().optional().default("UTC"),
});

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

    const validated = statusQuerySchema.parse({ from, to, tz });

    const fromDate = new Date(validated.from + "T00:00:00.000Z");
    const toDate = new Date(validated.to + "T23:59:59.999Z");

    if (fromDate > toDate) {
      return NextResponse.json(
        { error: "From date must be before or equal to to date" },
        { status: 400 },
      );
    }

    const statuses = await getDayStatusesForRange(
      user.id,
      fromDate,
      toDate,
      validated.tz,
    );

    return NextResponse.json({ statuses });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("Get day statuses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
