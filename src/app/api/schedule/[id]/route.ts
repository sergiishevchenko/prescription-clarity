import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";
import { updateScheduleStatusSchema } from "@/lib/validators/schedule";
import { updateDayStatusForDate } from "@/lib/day-status";

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
      select: { id: true, dateTime: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.scheduleEntry.update({
      where: { id },
      data: { status },
    });

    // Update day status cache for the entry's date
    // Note: We don't await this to avoid blocking the response
    updateDayStatusForDate(user.id, existing.dateTime, "UTC").catch((error) => {
      console.error("Failed to update day status cache:", error);
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("Update schedule status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/schedule/[id]
 * Delete a single schedule entry
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

    const existing = await prisma.scheduleEntry.findFirst({
      where: { id, userId: user.id },
      select: { id: true, dateTime: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    });

    // Update day status cache for the entry's date
    updateDayStatusForDate(user.id, existing.dateTime, "UTC").catch((error) => {
      console.error("Failed to update day status cache:", error);
    });

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Delete schedule entry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
