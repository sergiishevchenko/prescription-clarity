/**
 * Medication Service
 *
 * Business logic for medication edit/delete flows with versioning support.
 * Implements soft delete and schedule entry cleanup.
 */

import { prisma } from "./db";
import { updateDayStatusesForDates } from "./day-status";
import type { Medication, Schedule, Prisma } from "@prisma/client";

/**
 * Soft delete a medication by setting deletedAt timestamp
 */
export async function softDeleteMedication(
  medicationId: string,
  userId: string,
): Promise<Medication | null> {
  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      deletedAt: null,
    },
  });

  if (!medication) {
    return null;
  }

  return prisma.medication.update({
    where: { id: medicationId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Soft delete all schedules related to a medication
 */
export async function softDeleteRelatedSchedules(
  medicationId: string,
  userId: string,
): Promise<number> {
  const result = await prisma.schedule.updateMany({
    where: {
      medicationId,
      userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Delete future schedule entries for a medication
 * Only deletes entries where:
 * - dateTime >= fromDate (default: now)
 * - status is PLANNED (not DONE)
 *
 * Returns the deleted entries' dates for day status cache invalidation
 */
export async function deleteFutureScheduleEntries(
  medicationId: string,
  userId: string,
  fromDate?: Date,
): Promise<{ count: number; affectedDates: Date[] }> {
  const cutoffDate = fromDate ?? new Date();

  // First, get the entries we're about to delete (for day status cache)
  const entriesToDelete = await prisma.scheduleEntry.findMany({
    where: {
      medicationId,
      userId,
      dateTime: {
        gte: cutoffDate,
      },
      status: "PLANNED",
    },
    select: {
      id: true,
      dateTime: true,
    },
  });

  if (entriesToDelete.length === 0) {
    return { count: 0, affectedDates: [] };
  }

  // Extract unique dates for cache invalidation
  const affectedDates = Array.from(
    new Set(
      entriesToDelete.map((e) => {
        const d = new Date(e.dateTime);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }),
    ),
  ).map((iso) => new Date(iso));

  // Delete the entries
  const result = await prisma.scheduleEntry.deleteMany({
    where: {
      medicationId,
      userId,
      dateTime: {
        gte: cutoffDate,
      },
      status: "PLANNED",
    },
  });

  return { count: result.count, affectedDates };
}

/**
 * Delete future schedule entries by schedule ID
 */
export async function deleteFutureScheduleEntriesByScheduleId(
  scheduleId: string,
  userId: string,
  fromDate?: Date,
): Promise<{ count: number; affectedDates: Date[] }> {
  const cutoffDate = fromDate ?? new Date();

  // First, get the entries we're about to delete
  const entriesToDelete = await prisma.scheduleEntry.findMany({
    where: {
      scheduleId,
      userId,
      dateTime: {
        gte: cutoffDate,
      },
      status: "PLANNED",
    },
    select: {
      id: true,
      dateTime: true,
    },
  });

  if (entriesToDelete.length === 0) {
    return { count: 0, affectedDates: [] };
  }

  // Extract unique dates
  const affectedDates = Array.from(
    new Set(
      entriesToDelete.map((e) => {
        const d = new Date(e.dateTime);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      }),
    ),
  ).map((iso) => new Date(iso));

  // Delete the entries
  const result = await prisma.scheduleEntry.deleteMany({
    where: {
      scheduleId,
      userId,
      dateTime: {
        gte: cutoffDate,
      },
      status: "PLANNED",
    },
  });

  return { count: result.count, affectedDates };
}

export type CreateMedicationVersionInput = {
  name: string;
  dose?: number | null;
  form?: string | null;
};

// Helper to get day of week (1-7, Monday = 1, Sunday = 7)
function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Generate schedule entries for a schedule (used after creating new version)
 * This is a standalone function that doesn't rely on the API route
 *
 * IMPORTANT: This function only generates entries for FUTURE times.
 * Past times are skipped to avoid duplicating entries that already exist
 * in the previous medication version.
 */
async function generateScheduleEntriesForSchedule(
  schedule: {
    id: string;
    medicationId: string;
    userId: string;
    dateStart: Date;
    dateEnd: Date | null;
    frequencyDays: number[];
    timeOfDay: string[];
  },
  tx: Prisma.TransactionClient,
): Promise<number> {
  const entries: {
    scheduleId: string;
    medicationId: string;
    userId: string;
    dateTime: Date;
  }[] = [];

  const start = new Date(schedule.dateStart);
  const now = new Date(); // Current time for comparison (don't modify this!)

  // Create a separate date for iteration starting from today at midnight
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Start from today if the original start date is in the past
  const effectiveStart =
    start < todayMidnight ? new Date(todayMidnight) : new Date(start);
  effectiveStart.setHours(0, 0, 0, 0);

  const end = schedule.dateEnd
    ? new Date(schedule.dateEnd)
    : new Date(effectiveStart.getTime() + 365 * 24 * 60 * 60 * 1000);

  const current = new Date(effectiveStart);

  while (current <= end) {
    const dayOfWeek = getDayOfWeek(current);

    if (schedule.frequencyDays.includes(dayOfWeek)) {
      for (const timeStr of schedule.timeOfDay) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const entryDateTime = new Date(current);
        entryDateTime.setHours(hours, minutes, 0, 0);

        // Only create entries for future times (skip past times including earlier today)
        // This prevents duplicating entries that exist in the previous medication version
        if (entryDateTime > now) {
          entries.push({
            scheduleId: schedule.id,
            medicationId: schedule.medicationId,
            userId: schedule.userId,
            dateTime: entryDateTime,
          });
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  if (entries.length === 0) {
    return 0;
  }

  const result = await tx.scheduleEntry.createMany({
    data: entries,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Create a new version of a medication
 * - Soft deletes the previous version and its schedules
 * - Deletes future PLANNED schedule entries
 * - Creates a new medication with previousMedicationId link
 * - Copies the schedule to the new medication
 * - Generates new schedule entries for the new version
 */
export async function createMedicationVersion(
  previousMedicationId: string,
  newData: CreateMedicationVersionInput,
  userId: string,
): Promise<{
  newMedication: Medication;
  previousMedication: Medication;
  newSchedule: Schedule | null;
  deletedEntriesCount: number;
  generatedEntriesCount: number;
  affectedDates: Date[];
}> {
  // Verify the previous medication exists and belongs to user
  const previousMedication = await prisma.medication.findFirst({
    where: {
      id: previousMedicationId,
      userId,
      deletedAt: null,
    },
    include: {
      schedules: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get the most recent active schedule
      },
    },
  });

  if (!previousMedication) {
    throw new Error("Medication not found");
  }

  const existingSchedule = previousMedication.schedules[0] || null;

  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete future schedule entries for the old medication
    const entriesToDelete = await tx.scheduleEntry.findMany({
      where: {
        medicationId: previousMedicationId,
        userId,
        dateTime: {
          gte: new Date(),
        },
        status: "PLANNED",
      },
      select: {
        id: true,
        dateTime: true,
      },
    });

    const affectedDates = Array.from(
      new Set(
        entriesToDelete.map((e) => {
          const d = new Date(e.dateTime);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        }),
      ),
    ).map((iso) => new Date(iso));

    const deleteResult = await tx.scheduleEntry.deleteMany({
      where: {
        medicationId: previousMedicationId,
        userId,
        dateTime: {
          gte: new Date(),
        },
        status: "PLANNED",
      },
    });

    // 2. Soft delete related schedules
    await tx.schedule.updateMany({
      where: {
        medicationId: previousMedicationId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // 3. Soft delete the previous medication
    const softDeletedPrevious = await tx.medication.update({
      where: { id: previousMedicationId },
      data: { deletedAt: new Date() },
    });

    // 4. Create new medication version with link to previous
    const newMedication = await tx.medication.create({
      data: {
        userId,
        name: newData.name,
        dose: newData.dose ?? null,
        form: newData.form ?? null,
        previousMedicationId,
      },
    });

    // 5. Copy the schedule to the new medication (if exists)
    let newSchedule: Schedule | null = null;
    let generatedEntriesCount = 0;

    if (existingSchedule) {
      // Calculate new dateEnd based on original duration
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let newDateEnd: Date | null = null;
      if (existingSchedule.durationDays > 0) {
        newDateEnd = new Date(now);
        newDateEnd.setDate(
          newDateEnd.getDate() + existingSchedule.durationDays,
        );
      }

      newSchedule = await tx.schedule.create({
        data: {
          medicationId: newMedication.id,
          userId,
          quantity: existingSchedule.quantity,
          units: existingSchedule.units,
          frequencyDays: existingSchedule.frequencyDays as number[],
          durationDays: existingSchedule.durationDays,
          dateStart: now, // Start from today
          dateEnd: newDateEnd,
          timeOfDay: existingSchedule.timeOfDay as string[],
          mealTiming: existingSchedule.mealTiming,
        },
      });

      // 6. Generate new schedule entries for the new schedule
      generatedEntriesCount = await generateScheduleEntriesForSchedule(
        {
          id: newSchedule.id,
          medicationId: newMedication.id,
          userId,
          dateStart: now,
          dateEnd: newDateEnd,
          frequencyDays: existingSchedule.frequencyDays as number[],
          timeOfDay: existingSchedule.timeOfDay as string[],
        },
        tx,
      );

      // Add new dates to affected dates for day status update
      const newEntryDates = await tx.scheduleEntry.findMany({
        where: {
          scheduleId: newSchedule.id,
        },
        select: {
          dateTime: true,
        },
      });

      newEntryDates.forEach((e) => {
        const d = new Date(e.dateTime);
        d.setHours(0, 0, 0, 0);
        if (!affectedDates.some((ad) => ad.getTime() === d.getTime())) {
          affectedDates.push(d);
        }
      });
    }

    return {
      newMedication,
      previousMedication: softDeletedPrevious,
      newSchedule,
      deletedEntriesCount: deleteResult.count,
      generatedEntriesCount,
      affectedDates,
    };
  });

  return result;
}

/**
 * Full delete flow for a medication
 * 1. Soft delete the medication
 * 2. Soft delete related schedules
 * 3. Delete future PLANNED schedule entries
 * 4. Update day status cache for affected dates
 */
export async function deleteMedicationWithCleanup(
  medicationId: string,
  userId: string,
  timezone: string = "UTC",
): Promise<{
  success: boolean;
  deletedEntriesCount: number;
  deletedSchedulesCount: number;
}> {
  // Verify medication exists and belongs to user
  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      deletedAt: null,
    },
  });

  if (!medication) {
    return {
      success: false,
      deletedEntriesCount: 0,
      deletedSchedulesCount: 0,
    };
  }

  // Use a transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get future entries for day status cache
    const entriesToDelete = await tx.scheduleEntry.findMany({
      where: {
        medicationId,
        userId,
        dateTime: {
          gte: new Date(),
        },
        status: "PLANNED",
      },
      select: {
        dateTime: true,
      },
    });

    const affectedDates = Array.from(
      new Set(
        entriesToDelete.map((e) => {
          const d = new Date(e.dateTime);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        }),
      ),
    ).map((iso) => new Date(iso));

    // 2. Delete future PLANNED entries
    const deleteEntriesResult = await tx.scheduleEntry.deleteMany({
      where: {
        medicationId,
        userId,
        dateTime: {
          gte: new Date(),
        },
        status: "PLANNED",
      },
    });

    // 3. Soft delete schedules
    const deleteSchedulesResult = await tx.schedule.updateMany({
      where: {
        medicationId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // 4. Soft delete medication
    await tx.medication.update({
      where: { id: medicationId },
      data: { deletedAt: new Date() },
    });

    return {
      deletedEntriesCount: deleteEntriesResult.count,
      deletedSchedulesCount: deleteSchedulesResult.count,
      affectedDates,
    };
  });

  // Update day status cache for affected dates (async, don't block)
  if (result.affectedDates.length > 0) {
    updateDayStatusesForDates(userId, result.affectedDates, timezone).catch(
      (error) => {
        console.error(
          "Failed to update day status cache after medication deletion:",
          error,
        );
      },
    );
  }

  return {
    success: true,
    deletedEntriesCount: result.deletedEntriesCount,
    deletedSchedulesCount: result.deletedSchedulesCount,
  };
}

/**
 * Get the active schedule for a medication (not soft deleted)
 */
export async function getActiveScheduleForMedication(
  medicationId: string,
  userId: string,
): Promise<Schedule | null> {
  return prisma.schedule.findFirst({
    where: {
      medicationId,
      userId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get medication with its version history
 */
export async function getMedicationWithHistory(
  medicationId: string,
  userId: string,
): Promise<(Medication & { previousMedication: Medication | null }) | null> {
  return prisma.medication.findFirst({
    where: {
      id: medicationId,
      userId,
    },
    include: {
      previousMedication: true,
    },
  });
}
