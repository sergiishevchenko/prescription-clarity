import { prisma } from "./db";
import type { DayStatusType } from "@prisma/client";

/**
 * Get date only (without time) for a given date in a specific timezone
 */
function getDateOnly(date: Date, timezone: string = "UTC"): Date {
  const dateStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  // Parse as UTC to ensure we get the correct date
  return new Date(dateStr + "T00:00:00.000Z");
}

/**
 * Get start of day in UTC for a given date in a specific timezone
 */
function getStartOfDay(date: Date, timezone: string = "UTC"): Date {
  const dateOnly = getDateOnly(date, timezone);
  // Return as UTC date
  return dateOnly;
}

/**
 * Get end of day in UTC for a given date in a specific timezone
 */
function getEndOfDay(date: Date, timezone: string = "UTC"): Date {
  const startOfDay = getStartOfDay(date, timezone);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Format date as YYYY-MM-DD for map keys
 */
function formatDateForKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get all dates between start and end (inclusive)
 */
function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

/**
 * Calculate day status based on schedule entries for a specific date
 */
export async function calculateDayStatus(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<DayStatusType> {
  // Get start and end of day in user's timezone
  const startOfDay = getStartOfDay(date, timezone);
  const endOfDay = getEndOfDay(date, timezone);

  // Query entries for this day
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      status: true,
    },
  });

  // Calculate status
  const totalCount = entries.length;
  const plannedCount = entries.filter((e) => e.status === "PLANNED").length;
  const takenCount = entries.filter((e) => e.status === "DONE").length;

  // Get current date in the same timezone
  const now = new Date();
  const todayStart = getStartOfDay(now, timezone);
  const dateStart = getStartOfDay(date, timezone);
  const isPastDate = dateStart < todayStart;

  if (totalCount === 0) {
    return "NONE";
  }

  if (takenCount === totalCount) {
    return "ALL_TAKEN";
  }

  if (takenCount === 0 && isPastDate) {
    return "MISSED";
  }

  if (plannedCount === totalCount && !isPastDate) {
    return "SCHEDULED";
  }

  // Some taken, some not
  return "PARTIAL";
}

/**
 * Update or create day status cache for a specific date
 */
export async function updateDayStatusForDate(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<void> {
  const dateOnly = getDateOnly(date, timezone);
  const status = await calculateDayStatus(userId, date, timezone);

  // Get detailed counts
  const startOfDay = getStartOfDay(date, timezone);
  const endOfDay = getEndOfDay(date, timezone);

  const entries = await prisma.scheduleEntry.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      status: true,
    },
  });

  const totalCount = entries.length;
  const plannedCount = entries.filter((e) => e.status === "PLANNED").length;
  const takenCount = entries.filter((e) => e.status === "DONE").length;

  await prisma.dayStatus.upsert({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
    create: {
      userId,
      date: dateOnly,
      status,
      totalCount,
      plannedCount,
      takenCount,
    },
    update: {
      status,
      totalCount,
      plannedCount,
      takenCount,
    },
  });
}

/**
 * Get or compute day status (with caching)
 */
export async function getDayStatus(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<DayStatusType> {
  const dateOnly = getDateOnly(date, timezone);

  // Try to get from cache first
  const cached = await prisma.dayStatus.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
  });

  if (cached) {
    return cached.status;
  }

  // Compute and cache
  await updateDayStatusForDate(userId, date, timezone);

  // Retrieve the cached value
  const updated = await prisma.dayStatus.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateOnly,
      },
    },
  });

  return updated?.status || "NONE";
}

/**
 * Get statuses for a date range (for calendar view)
 * Returns a map of date string (YYYY-MM-DD) -> DayStatusType
 */
export async function getDayStatusesForRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  timezone: string = "UTC",
): Promise<Record<string, DayStatusType>> {
  const start = getDateOnly(startDate, timezone);
  const end = getDateOnly(endDate, timezone);

  // Get cached statuses for the range
  const cachedStatuses = await prisma.dayStatus.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      date: true,
      status: true,
    },
  });

  const statusMap: Record<string, DayStatusType> = {};

  // Add cached statuses to map
  cachedStatuses.forEach((s) => {
    const dateKey = formatDateForKey(s.date);
    statusMap[dateKey] = s.status;
  });

  // Compute missing dates on demand
  const allDates = getDatesBetween(start, end);
  for (const date of allDates) {
    const dateKey = formatDateForKey(date);
    if (!statusMap[dateKey]) {
      await updateDayStatusForDate(userId, date, timezone);
      // Retrieve the computed value
      const computed = await prisma.dayStatus.findUnique({
        where: {
          userId_date: {
            userId,
            date: getDateOnly(date, timezone),
          },
        },
      });
      if (computed) {
        statusMap[dateKey] = computed.status;
      } else {
        statusMap[dateKey] = "NONE";
      }
    }
  }

  return statusMap;
}

/**
 * Update day status for multiple dates (batch operation)
 * Useful when generating schedule or bulk updates
 */
export async function updateDayStatusesForDates(
  userId: string,
  dates: Date[],
  timezone: string = "UTC",
): Promise<void> {
  // Update each date in parallel (or sequentially if preferred)
  await Promise.all(
    dates.map((date) => updateDayStatusForDate(userId, date, timezone)),
  );
}

/**
 * Invalidate day status cache for a specific date
 * (Delete the cache entry so it will be recomputed on next access)
 */
export async function invalidateDayStatus(
  userId: string,
  date: Date,
  timezone: string = "UTC",
): Promise<void> {
  const dateOnly = getDateOnly(date, timezone);
  await prisma.dayStatus.deleteMany({
    where: {
      userId,
      date: dateOnly,
    },
  });
}

/**
 * Invalidate day status cache for multiple dates (batch operation)
 * Useful after medication/schedule deletion or edit
 */
export async function invalidateDayStatusesForDates(
  userId: string,
  dates: Date[],
  timezone: string = "UTC",
): Promise<number> {
  if (dates.length === 0) {
    return 0;
  }

  const dateOnlyValues = dates.map((date) => getDateOnly(date, timezone));

  const result = await prisma.dayStatus.deleteMany({
    where: {
      userId,
      date: {
        in: dateOnlyValues,
      },
    },
  });

  return result.count;
}

/**
 * Invalidate and immediately recalculate day statuses for given dates
 * This is useful when you want to ensure the cache is up-to-date immediately
 */
export async function refreshDayStatusesForDates(
  userId: string,
  dates: Date[],
  timezone: string = "UTC",
): Promise<void> {
  if (dates.length === 0) {
    return;
  }

  // First invalidate
  await invalidateDayStatusesForDates(userId, dates, timezone);

  // Then recalculate
  await updateDayStatusesForDates(userId, dates, timezone);
}
