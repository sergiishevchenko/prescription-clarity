import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { updateScheduleStatusSchema } from "@/lib/validators/schedule";

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

    const body = await request.json();
    const { status } = updateScheduleStatusSchema.parse(body);

    const existing = await prisma.scheduleEntry.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.scheduleEntry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    console.error("Update schedule status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
