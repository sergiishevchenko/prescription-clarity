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
  // Historical entry indicators (for deleted medications/schedules)
  isFromDeletedMedication?: boolean;
  isFromDeletedSchedule?: boolean;
};

export type ScheduleTemplateItem = {
  id: string;
  medicationId: string;
  userId: string;
  quantity: number;
  units: string;
  frequencyDays: number[];
  durationDays: number;
  dateStart: string;
  dateEnd: string | null;
  timeOfDay: string[];
  mealTiming: "before" | "with" | "after" | "anytime";
  createdAt: string;
  updatedAt: string;
  medication: {
    id: string;
    name: string;
    dose: number | null;
    form?: string | null;
  } | null;
};

export async function getScheduleEntries(
  from: Date,
  to: Date,
  timezone: string = "UTC",
  userId?: string,
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
  if (userId) {
    url.searchParams.set("userId", userId);
  }

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

export async function getScheduleTemplates(): Promise<ScheduleTemplateItem[]> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const url = new URL(absoluteUrl("/api/schedule/templates"));
  const res = await fetch(url.toString(), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Failed to load schedule templates: ${res.statusText}`);
  }

  const data = (await res.json()) as { items: ScheduleTemplateItem[] };
  return data.items;
}

export async function getDayStatuses(
  from: Date,
  to: Date,
  timezone: string = "UTC",
): Promise<Record<string, string>> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  // Format dates as YYYY-MM-DD
  const fromStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);

  const toStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(to);

  const url = new URL(absoluteUrl("/api/schedule/status"));
  url.searchParams.set("from", fromStr);
  url.searchParams.set("to", toStr);
  url.searchParams.set("tz", timezone);

  const res = await fetch(url.toString(), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return {};
  }

  if (!res.ok) {
    throw new Error(`Failed to load day statuses: ${res.statusText}`);
  }

  const data = (await res.json()) as { statuses: Record<string, string> };
  return data.statuses;
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
