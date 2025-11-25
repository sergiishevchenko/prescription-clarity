import { NextRequest, NextResponse } from "next/server";

import { getSessionUserFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildScheduleHtml } from "@/lib/pdf/template";
import { PdfTimeoutError, renderPdfBuffer } from "@/lib/pdf/render";
import {
  toPrintableEntries,
  type ScheduleEntryWithRelations,
} from "@/lib/pdf/types";
import { exportPdfSchema, type ExportPdfInput } from "@/lib/validators/pdf";

export const runtime = "nodejs";

const PDF_TIMEOUT_MS = 20000;

export async function POST(request: NextRequest) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ExportPdfInput;
  try {
    payload = await parseRequest(request);
  } catch {
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }

  if (payload.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let fromDate: Date;
  let toDate: Date;
  try {
    fromDate = parseDateInput(payload.from);
    toDate = parseDateInput(payload.to, { endOfDay: true });
  } catch {
    return NextResponse.json({ error: "Invalid date value" }, { status: 422 });
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { error: "Invalid date range" },
      { status: 422 },
    );
  }

  try {
    const totalCount = await prisma.scheduleEntry.count({
      where: {
        userId: user.id,
        dateTime: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const entries = (await prisma.scheduleEntry.findMany({
      where: {
        userId: user.id,
        dateTime: {
          gte: fromDate,
          lte: toDate,
        },
        medicationId: { not: null },
      },
      include: {
        medication: {
          select: { id: true, name: true, dose: true, form: true, deletedAt: true },
        },
        schedule: {
          select: {
            quantity: true,
            units: true,
            mealTiming: true,
          },
        },
      },
      orderBy: [{ dateTime: "asc" }, { id: "asc" }],
    })) as ScheduleEntryWithRelations[];

    const validEntries = entries.filter(
      (entry) =>
        entry.medication !== null &&
        entry.medication !== undefined &&
        entry.medication.deletedAt === null,
    );

    if (!validEntries.length) {
      const entriesWithoutMedicationId = totalCount - entries.length;
      const entriesWithNullMedication = entries.filter((e) => e.medication === null).length;
      const entriesWithDeletedMedication = entries.filter(
        (e) => e.medication?.deletedAt !== null,
      ).length;

      console.log("No valid entries found", {
        userId: user.id,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
        totalEntriesInRange: totalCount,
        entriesWithMedicationId: entries.length,
        entriesWithoutMedicationId,
        entriesWithNullMedication,
        entriesWithDeletedMedication,
        validEntries: validEntries.length,
      });

      return NextResponse.json(
        { error: "No schedule entries for selected dates" },
        { status: 404 },
      );
    }

    const printableEntries = toPrintableEntries(validEntries);
    const rangeLabel = formatRangeLabel(fromDate, toDate, payload.tz);
    const html = buildScheduleHtml({
      entries: printableEntries,
      tz: payload.tz,
      from: fromDate,
      to: toDate,
      userName: user.name ?? user.email,
      rangeLabel,
      generatedAt: new Date(),
    });

    const pdfBuffer = await renderPdfBuffer(html, { timeoutMs: PDF_TIMEOUT_MS });
    const headers = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildFileName(fromDate, toDate)}"`,
      "Content-Length": `${pdfBuffer.length}`,
      "Cache-Control": "no-store",
    };

    return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers });
  } catch (error) {
    if (error instanceof PdfTimeoutError) {
      return NextResponse.json(
        { error: "PDF rendering timeout" },
        { status: 422 },
      );
    }
    console.error("Export PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function parseRequest(request: NextRequest): Promise<ExportPdfInput> {
  const body = await request.json().catch(() => {
    throw new Error("Invalid JSON payload");
  });
  return exportPdfSchema.parse(body);
}

function parseDateInput(
  value: string,
  options?: { endOfDay?: boolean },
): Date {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value");
  }
  if (options?.endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function formatRangeLabel(from: Date, to: Date, tz: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(from)} - ${formatter.format(to)}`;
}

function buildFileName(from: Date, to: Date): string {
  return `schedule-${formatFileDate(from)}-${formatFileDate(to)}.pdf`;
}

function formatFileDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
