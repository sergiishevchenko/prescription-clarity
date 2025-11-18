import { cookies } from "next/headers";
import { absoluteUrl } from "./url";

export type ScheduleEntryItem = {
  id: string;
  medicationId: string | null;
  userId: string;
  status: "PLANNED" | "DONE";
  utcDateTime: string;
  localDateTime: string;
  quantity: number | null;
  units: string | null;
  mealTiming: string | null;
  medication: {
    id: string;
    name: string;
    dose: number;
  } | null;
};

export async function getScheduleEntries(
  from: Date,
  to: Date,
  timezone: string = "UTC",
): Promise<ScheduleEntryItem[]> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  const url = new URL(absoluteUrl("/api/schedule"));
  url.searchParams.set("from", fromISO);
  url.searchParams.set("to", toISO);
  url.searchParams.set("tz", timezone);

  const res = await fetch(url.toString(), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Failed to load schedule entries: ${res.statusText}`);
  }

  const data = (await res.json()) as { items: ScheduleEntryItem[] };
  return data.items;
}

// Re-export client-safe utilities for convenience
export {
  extractTimeFromLocalDateTime,
  extractDateFromLocalDateTime,
  formatDose,
  formatDosage,
  mapMealTimingToContext,
  updateScheduleEntryStatus,
} from "./schedule-utils";
