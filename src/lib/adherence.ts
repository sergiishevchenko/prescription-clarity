import { prisma } from "./db";

type AdherenceWindow = 7 | 30;

export type AdherenceSummary = {
  windowDays: AdherenceWindow;
  adherence: number | null; // percentage 0-100, null if no data
};

function getWindowStart(days: AdherenceWindow): Date {
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Compute adherence for a user over a given window.
 * Adherence = takenCount / plannedCount * 100
 * Uses DayStatus aggregates when available for better performance.
 */
export async function computeAdherenceForUser(
  userId: string,
  windowDays: AdherenceWindow,
): Promise<number | null> {
  const now = new Date();
  const startDate = getWindowStart(windowDays);

  // Use DayStatus aggregates to avoid scanning all schedule entries
  // For adherence, we need:
  // - totalCount: all scheduled doses (regardless of status)
  // - takenCount: doses that were actually taken
  const statuses = await prisma.dayStatus.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: now,
      },
    },
    select: {
      totalCount: true,
      takenCount: true,
    },
  });

  const totalPlanned = statuses.reduce((sum, s) => sum + s.totalCount, 0);
  const totalTaken = statuses.reduce((sum, s) => sum + s.takenCount, 0);

  if (totalPlanned === 0) {
    return null;
  }

  const ratio = totalTaken / totalPlanned;
  const percent = Math.round(ratio * 100);

  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, percent));
}

/**
 * Convenience helper to get both 7-day and 30-day adherence summaries.
 */
export async function getAdherenceSummariesForUser(
  userId: string,
): Promise<AdherenceSummary[]> {
  const [last7, last30] = await Promise.all([
    computeAdherenceForUser(userId, 7),
    computeAdherenceForUser(userId, 30),
  ]);

  return [
    { windowDays: 7, adherence: last7 },
    { windowDays: 30, adherence: last30 },
  ];
}
