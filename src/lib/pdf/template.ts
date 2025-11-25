import type { MealTiming, ScheduleEntryPrintable } from "@/lib/pdf/types";
import { PRINT_SCHEDULE_CSS } from "@/lib/pdf/styles";

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
  medDetails: string;
  quantityLabel: string;
  mealLabel: string;
  statusLabel: string;
}

interface PrintableCell {
  entries: PrintableCellEntry[];
}

interface PrintableRow {
  timeLabel: string;
  mealTiming: MealTiming;
  cells: PrintableCell[];
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

  const days = buildDays(from, to, tz);
  const rows = buildRows(entries, days, tz);
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
      <div class="print-table-wrapper">
        <table class="print-table">
          <thead>
            <tr>
              <th class="time-col">Time</th>
              <th class="meal-col">🍽️</th>
              ${days.map((day) => `<th>${escapeHtml(day.label)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => buildRow(row)).join("")}
          </tbody>
        </table>
      </div>
      ${buildLegend()}
      <div class="print-footer">
        Generated ${escapeHtml(generatedLabel)} • Prescription Clarity
      </div>
    </div>
  </body>
</html>`;
}

function buildRow(row: PrintableRow): string {
  return `<tr>
    <td class="time-col">${escapeHtml(row.timeLabel)}</td>
    <td class="meal-col">
      <span class="meal-symbol ${row.mealTiming}"></span>
    </td>
    ${row.cells.map((cell) => buildCell(cell)).join("")}
  </tr>`;
}

function buildCell(cell: PrintableCell): string {
  if (!cell.entries.length) {
    return `<td class="empty-cell">—</td>`;
  }

  return `<td>
    ${cell.entries
      .map(
        (entry) => `<div class="med-item">
          <span class="med-name">${escapeHtml(entry.medicationName)}</span>
          <span class="med-details">${escapeHtml(entry.medDetails)}</span>
          <div class="med-instruction">
            <span>${escapeHtml(entry.quantityLabel)}</span>
            <span>${escapeHtml(entry.mealLabel)}</span>
          </div>
          <div class="med-checkbox-row">
            <input type="checkbox" />
            <span class="checkbox-label">${escapeHtml(entry.statusLabel)}</span>
          </div>
        </div>`,
      )
      .join("")}
  </td>`;
}

function buildLegend(): string {
  return `<div class="print-legend">
    ${(["before", "with", "after", "anytime"] as MealTiming[])
      .map(
        (type) => `<div class="legend-item">
        <span class="meal-symbol legend-symbol ${type}"></span>
        <span>${MEAL_LABELS[type]}</span>
      </div>`,
      )
      .join("")}
  </div>`;
}

function buildLogo(): string {
  return `<svg width="52" height="52" viewBox="0 0 64 64" role="img" aria-label="Logo">
    <rect width="64" height="64" rx="12" fill="#0f9afe" />
    <text x="50%" y="55%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#fff">Rx</text>
  </svg>`;
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

function buildDays(from: Date, to: Date, tz: string): PrintableDay[] {
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
  const days: PrintableDay[] = [];
  const seen = new Set<string>();
  for (
    let cursor = from.getTime();
    cursor <= to.getTime() + oneDayMs;
    cursor += oneDayMs
  ) {
    const date = new Date(cursor);
    const key = keyFormatter.format(date);
    if (seen.has(key)) continue;
    seen.add(key);
    days.push({
      key,
      label: dayFormatter.format(date),
    });
  }
  return days;
}

function buildRows(
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
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const daysByKey = new Map(days.map((day) => [day.key, day]));
  const grouped = new Map<
    string,
    Map<string, Array<{ entry: ScheduleEntryPrintable; printable: PrintableCellEntry }>>
  >();

  for (const entry of entries) {
    const dayKey = dateKeyFormatter.format(entry.dateUtc);
    if (!daysByKey.has(dayKey)) {
      continue;
    }
    const timeLabel = timeFormatter.format(entry.dateUtc);
    const cellEntry: PrintableCellEntry = {
      medicationName: entry.medicationName,
      medDetails: entry.medDetails,
      quantityLabel: entry.quantityLabel,
      mealLabel: MEAL_LABELS[entry.mealTiming],
      statusLabel: entry.statusLabel,
    };

    const timeGroup =
      grouped.get(timeLabel) ??
      new Map<
        string,
        Array<{ entry: ScheduleEntryPrintable; printable: PrintableCellEntry }>
      >();
    const cellEntries = timeGroup.get(dayKey) ?? [];
    cellEntries.push({ entry, printable: cellEntry });
    timeGroup.set(dayKey, cellEntries);
    grouped.set(timeLabel, timeGroup);
  }

  const sortedTimes = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b),
  );

  return sortedTimes.map((timeLabel) => {
    const timeGroup = grouped.get(timeLabel)!;
    const flatEntries = Array.from(timeGroup.values()).flat();
    const mealTiming = resolveRowMealTiming(flatEntries.map((item) => item.entry));
    return {
      timeLabel,
      mealTiming,
      cells: days.map((day) => ({
        entries:
          (timeGroup.get(day.key)?.map((item) => item.printable) as
            | PrintableCellEntry[]
            | undefined) ?? [],
      })),
    };
  });
}

function resolveRowMealTiming(entries: ScheduleEntryPrintable[]): MealTiming {
  const distinct = new Set(entries.map((entry) => entry.mealTiming));
  if (distinct.size === 1) {
    return entries[0]?.mealTiming ?? "anytime";
  }
  if (!entries.length) {
    return "anytime";
  }
  if (distinct.has("before")) return "before";
  if (distinct.has("with")) return "with";
  if (distinct.has("after")) return "after";
  return "anytime";
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
