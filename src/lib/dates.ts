const ukFormatter = new Intl.DateTimeFormat("uk-UA", { timeZone: "UTC" });

function toUTCDate(input: Date | string): Date {
  if (input instanceof Date) return input;
  const s = String(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + "T00:00:00.000Z");
  }
  return new Date(s);
}

export function formatDate(input: Date | string): string {
  const d = toUTCDate(input);
  if (Number.isNaN(d.getTime())) return "";
  return ukFormatter.format(d);
}

export function formatDateRange(
  start: Date | string,
  end: Date | string,
): string {
  const a = formatDate(start);
  const b = formatDate(end);
  return a && b ? `${a} - ${b}` : a || b || "";
}
