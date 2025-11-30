import type { MealTiming, ScheduleEntryPrintable } from "@/lib/pdf/types";
import { PRINT_SCHEDULE_CSS } from "@/lib/pdf/styles";
import { readFileSync } from "fs";
import { join } from "path";

interface BuildScheduleHtmlOptions {
  entries: ScheduleEntryPrintable[];
  tz: string;
  from: Date;
  to: Date;
  userName: string;
  rangeLabel: string;
  generatedAt: Date;
}

interface PrintableDay {
  key: string;
  label: string;
}

interface PrintableCellEntry {
  medicationName: string;
  dose: string;
  form: string;
}

interface PrintableCell {
  entries: PrintableCellEntry[];
  mealTiming: MealTiming | null;
}

interface PrintableRow {
  timeLabel: string;
  cells: PrintableCell[];
}

interface PrintableWeek {
  days: PrintableDay[];
  rows: PrintableRow[];
}

const MEAL_LABELS: Record<MealTiming, string> = {
  before: "Before meal",
  with: "With meal",
  after: "After meal",
  anytime: "Anytime",
};

const DISPLAY_TITLE = "Weekly Medication Schedule";

export function buildScheduleHtml(options: BuildScheduleHtmlOptions): string {
  const { entries, tz, from, to, userName, rangeLabel, generatedAt } = options;

  const weeks = buildWeeks(from, to, tz, entries);
  const documentTitle = `${DISPLAY_TITLE} • ${rangeLabel}`;
  const generatedLabel = formatGeneratedAt(generatedAt, tz);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(documentTitle)}</title>
    <style>${PRINT_SCHEDULE_CSS}</style>
  </head>
  <body>
    <div class="print-container">
      <div class="print-header">
        <div class="print-header-left">
          ${buildLogo()}
          <h1>${DISPLAY_TITLE}</h1>
          <p>${escapeHtml(userName)}</p>
          <p class="print-week-info">${escapeHtml(rangeLabel)}</p>
          <span class="print-date">Time zone: ${escapeHtml(tz)}</span>
        </div>
        <div class="print-qr-wrapper">
          ${buildQrPlaceholder()}
        </div>
      </div>
      ${weeks.map((week) => buildWeekTable(week)).join("")}
      ${buildLegend()}
      <div class="print-footer">
        Generated ${escapeHtml(generatedLabel)} • Prescription Clarity
      </div>
    </div>
  </body>
</html>`;
}

function buildWeekTable(week: PrintableWeek): string {
  return `<div class="print-table-wrapper">
    <table class="print-table">
      <thead>
        <tr>
          <th class="time-col">Time</th>
          <th class="meal-col">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2H3z"/>
              <path d="M7 2v20"/>
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v0"/>
              <path d="M21 15c0 2.5-2 4.5-4.5 4.5S12 17.5 12 15"/>
            </svg>
          </th>
          ${week.days.map((day) => `<th>${escapeHtml(day.label)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${week.rows.map((row) => buildRow(row)).join("")}
      </tbody>
    </table>
  </div>`;
}

function buildRow(row: PrintableRow): string {
  const mealTimings = row.cells
    .map((cell) => cell.mealTiming)
    .filter((mt): mt is MealTiming => mt !== null);

  const rowMealTiming = resolveMealTiming(mealTimings);
  const hasMealTiming = mealTimings.length > 0;

  return `<tr>
    <td class="time-col">${escapeHtml(row.timeLabel)}</td>
    <td class="meal-col">
      ${hasMealTiming ? `<span class="meal-symbol ${rowMealTiming}"></span>` : "—"}
    </td>
    ${row.cells.map((cell) => buildCell(cell)).join("")}
  </tr>`;
}

function resolveMealTiming(timings: MealTiming[]): MealTiming {
  if (timings.length === 0) return "anytime";

  if (timings.includes("before")) return "before";
  if (timings.includes("with")) return "with";
  if (timings.includes("after")) return "after";

  return timings[0] ?? "anytime";
}

function buildCell(cell: PrintableCell): string {
  if (!cell.entries.length) {
    return `<td class="empty-cell">—</td>`;
  }

  return `<td>
    ${cell.entries
      .map((entry) => {
        return `<div class="med-item">
            <span class="med-name">${escapeHtml(entry.medicationName)}</span>
            ${entry.dose ? `<span class="med-dose">${escapeHtml(entry.dose)}</span>` : ""}
            ${entry.form ? `<span class="med-quantity">${escapeHtml(entry.form)}</span>` : ""}
            <div class="med-checkbox-row">
              <input type="checkbox" />
              <span class="checkbox-label">DONE</span>
            </div>
          </div>`;
      })
      .join("")}
  </td>`;
}

function buildLegend(): string {
  return `<div class="print-legend">
    <strong>Meal Timing:</strong>
    ${(["before", "with", "after", "anytime"] as MealTiming[])
      .map(
        (type) =>
          `<span class="legend-symbol ${type}"></span> ${MEAL_LABELS[type]}`,
      )
      .join(" ")}
  </div>`;
}

function getLogoBase64(): string {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const logoBuffer = readFileSync(logoPath);
    return logoBuffer.toString("base64");
  } catch (error) {
    console.error("Failed to read logo file:", error);
    return "";
  }
}

function buildLogo(): string {
  const logoBase64 = getLogoBase64();
  if (!logoBase64) {
    return `<svg width="52" height="52" viewBox="0 0 64 64" role="img" aria-label="Logo">
      <rect width="64" height="64" rx="12" fill="#0f9afe" />
      <text x="50%" y="55%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#fff">Rx</text>
    </svg>`;
  }
  return `<img src="data:image/png;base64,${logoBase64}" alt="Prescription Clarity Logo" width="52" height="52" style="display: block;" role="img" aria-label="Logo" />`;
}

function buildQrPlaceholder(): string {
  const cells: string[] = [];
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      if ((x + y) % 2 === 0) {
        cells.push(
          `<rect x="${x * 4}" y="${y * 4}" width="4" height="4" fill="#000" />`,
        );
      }
    }
  }
  return `<svg width="64" height="64" viewBox="0 0 24 24">${cells.join("")}</svg>`;
}

function buildWeeks(
  from: Date,
  to: Date,
  tz: string,
  entries: ScheduleEntryPrintable[],
): PrintableWeek[] {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const keyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const oneDayMs = 24 * 60 * 60 * 1000;
  const allDays: PrintableDay[] = [];
  const seen = new Set<string>();

  for (
    let cursor = from.getTime();
    cursor <= to.getTime();
    cursor += oneDayMs
  ) {
    const date = new Date(cursor);
    const key = keyFormatter.format(date);
    if (seen.has(key)) continue;
    seen.add(key);
    allDays.push({
      key,
      label: dayFormatter.format(date),
    });
  }

  const weeks: PrintableWeek[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    const weekRows = buildRowsForWeek(entries, weekDays, tz);
    weeks.push({
      days: weekDays,
      rows: weekRows,
    });
  }

  return weeks;
}

function buildRowsForWeek(
  entries: ScheduleEntryPrintable[],
  days: PrintableDay[],
  tz: string,
): PrintableRow[] {
  const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const daysByKey = new Map(days.map((day) => [day.key, day]));
  const grouped = new Map<
    string,
    Map<
      string,
      Array<{
        entry: ScheduleEntryPrintable;
        printable: PrintableCellEntry;
        mealTiming: MealTiming | null;
      }>
    >
  >();

  for (const entry of entries) {
    const dayKey = dateKeyFormatter.format(entry.dateUtc);
    if (!daysByKey.has(dayKey)) {
      continue;
    }
    const timeLabel = timeFormatter.format(entry.dateUtc);
    const cellEntry: PrintableCellEntry = {
      medicationName: entry.medicationName,
      dose: entry.dose,
      form: entry.form,
    };

    const timeGroup =
      grouped.get(timeLabel) ??
      new Map<
        string,
        Array<{
          entry: ScheduleEntryPrintable;
          printable: PrintableCellEntry;
          mealTiming: MealTiming | null;
        }>
      >();
    const cellEntries = timeGroup.get(dayKey) ?? [];
    cellEntries.push({
      entry,
      printable: cellEntry,
      mealTiming: entry.mealTiming,
    });
    timeGroup.set(dayKey, cellEntries);
    grouped.set(timeLabel, timeGroup);
  }

  const sortedTimes = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b),
  );

  return sortedTimes.map((timeLabel) => {
    const timeGroup = grouped.get(timeLabel)!;
    return {
      timeLabel,
      cells: days.map((day) => {
        const dayEntries = timeGroup.get(day.key) ?? [];

        const seenMedications = new Set<string>();
        const uniqueEntries = dayEntries.filter((item) => {
          const key = `${item.printable.medicationName}-${item.printable.dose}-${item.printable.form}`;
          if (seenMedications.has(key)) {
            return false;
          }
          seenMedications.add(key);
          return true;
        });

        const cellMealTiming =
          uniqueEntries.length > 0 ? uniqueEntries[0].mealTiming : null;
        return {
          entries: uniqueEntries.map((item) => item.printable),
          mealTiming: cellMealTiming,
        };
      }),
    };
  });
}

function formatGeneratedAt(date: Date, tz: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(date);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
