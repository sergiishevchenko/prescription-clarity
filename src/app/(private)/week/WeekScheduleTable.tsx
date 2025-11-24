"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import styles from "./week.module.css";
import {
  extractDateFromLocalDateTime,
  extractTimeFromLocalDateTime,
  formatDose,
  formatDosage,
  updateScheduleEntryStatus,
} from "@/lib/schedule-utils";
import type { ScheduleEntryItem } from "@/lib/schedule";

type MedicationItem = {
  id: string;
  name: string;
  dosage: string;
  dose: string;
  mealTiming: "before" | "with" | "after" | "any";
  isTaken: boolean;
  status: "PLANNED" | "DONE";
};

type TimeSlot = {
  time: string;
  medications: MedicationItem[];
};

type StatusFilter = "all" | "taken" | "missed";
type MealTimingFilter = "all" | "before" | "with" | "after";

type WeekScheduleTableProps = {
  initialEntries: ScheduleEntryItem[];
  weekDays: Date[];
  today: Date;
  statusFilter?: StatusFilter;
  mealTimingFilter?: MealTimingFilter;
};

export function WeekScheduleTable({
  initialEntries,
  weekDays,
  today,
  statusFilter = "all",
  mealTimingFilter = "all",
}: WeekScheduleTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Filter entries based on active filters
  const filteredEntries = initialEntries.filter((entry) => {
    if (!entry.medication) return false;

    // Status filter
    if (statusFilter === "taken" && entry.status !== "DONE") {
      return false;
    }
    if (statusFilter === "missed" && entry.status !== "PLANNED") {
      return false;
    }

    // Meal timing filter
    const entryMealTiming =
      entry.mealTiming === "anytime" ? "any" : entry.mealTiming || "any";
    if (mealTimingFilter !== "all") {
      if (entryMealTiming !== mealTimingFilter) {
        return false;
      }
    }

    return true;
  });

  // Ensure deterministic ordering so UI never reshuffles after updates
  const sortedEntries = filteredEntries.slice().sort((a, b) => {
    const timeCompare = a.localDateTime.localeCompare(b.localDateTime);
    if (timeCompare !== 0) {
      return timeCompare;
    }

    const nameA = a.medication?.name ?? "";
    const nameB = b.medication?.name ?? "";
    const nameCompare = nameA.localeCompare(nameB);
    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.id.localeCompare(b.id);
  });

  // Transform API response to week data format: Record<date, TimeSlot[]>
  const weekData: Record<string, TimeSlot[]> = {};

  sortedEntries.forEach((entry) => {
    const date = extractDateFromLocalDateTime(entry.localDateTime);
    const time = extractTimeFromLocalDateTime(entry.localDateTime);

    if (!date || !time) return;

    if (!weekData[date]) {
      weekData[date] = [];
    }

    let timeSlot = weekData[date].find((slot) => slot.time === time);
    if (!timeSlot) {
      timeSlot = { time, medications: [] };
      weekData[date].push(timeSlot);
    }

    const mealTiming =
      entry.mealTiming === "anytime" ? "any" : entry.mealTiming || "any";
    timeSlot.medications.push({
      id: entry.id,
      name: entry.medication!.name,
      dosage: formatDosage(entry.medication!.dose),
      dose: formatDose(entry.quantity, entry.units),
      mealTiming: mealTiming as "before" | "with" | "after" | "any",
      isTaken: entry.status === "DONE",
      status: entry.status,
    });
  });

  // Sort time slots within each day
  Object.keys(weekData).forEach((date) => {
    weekData[date].sort((a, b) => a.time.localeCompare(b.time));
  });

  // Get all unique time slots across the week
  const allTimeSlots = new Set<string>();
  Object.values(weekData).forEach((dayData) => {
    dayData.forEach((slot) => allTimeSlots.add(slot.time));
  });
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  const handleStatusToggle = async (med: MedicationItem) => {
    const newStatus = med.status === "PLANNED" ? "DONE" : "PLANNED";

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(med.id));

    try {
      await updateScheduleEntryStatus(med.id, newStatus);

      // Refresh the page data
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update schedule entry:", error);
      // On error, refresh to restore correct state
      router.refresh();
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(med.id);
        return next;
      });
    }
  };

  function formatDate(
    date: Date,
    format: "MMM d" | "EEE" | "d" | "yyyy-MM-dd",
  ): string {
    if (format === "MMM d") {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(date);
    }
    if (format === "EEE") {
      return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
        date,
      );
    }
    if (format === "d") {
      return date.getDate().toString();
    }
    if (format === "yyyy-MM-dd") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  return (
    <>
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.timeHeader}>Time</th>
                {weekDays.map((day) => {
                  const dayKey = formatDate(day, "yyyy-MM-dd");
                  const todayKey = formatDate(today, "yyyy-MM-dd");
                  const isToday = dayKey === todayKey;
                  return (
                    <th
                      key={dayKey}
                      className={clsx(
                        styles.dayHeader,
                        isToday && styles.dayHeaderToday,
                      )}
                    >
                      <div className={styles.dayName}>
                        {formatDate(day, "EEE")}
                      </div>
                      <div
                        className={clsx(
                          styles.dayNumber,
                          isToday && styles.dayNumberToday,
                        )}
                      >
                        {formatDate(day, "d")}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedTimeSlots.map((time) => (
                <tr key={time}>
                  <td className={styles.timeCell}>
                    <div className={styles.timeText}>{time}</div>
                  </td>
                  {weekDays.map((day) => {
                    const dayKey = formatDate(day, "yyyy-MM-dd");
                    const todayKey = formatDate(today, "yyyy-MM-dd");
                    const isToday = dayKey === todayKey;
                    const dayData = weekData[dayKey] || [];
                    const slot = dayData.find((s) => s.time === time);
                    const medications = slot?.medications || [];

                    return (
                      <td
                        key={`${dayKey}-${time}`}
                        className={clsx(
                          styles.dayCell,
                          isToday && styles.dayCellToday,
                        )}
                      >
                        <div className={styles.medicationsList}>
                          {medications.map((med) => {
                            const isUpdating = updatingIds.has(med.id);
                            return (
                              <div
                                key={med.id}
                                className={clsx(
                                  styles.medCard,
                                  med.isTaken && styles.medCardTaken,
                                )}
                              >
                                <button
                                  type="button"
                                  className={clsx(
                                    styles.checkbox,
                                    med.isTaken && styles.checkboxChecked,
                                  )}
                                  aria-label={`Mark ${med.name} as ${med.isTaken ? "not taken" : "taken"}`}
                                  onClick={() => handleStatusToggle(med)}
                                  disabled={isUpdating || isPending}
                                >
                                  {med.isTaken && (
                                    <CheckIcon className={styles.checkIcon} />
                                  )}
                                </button>
                                <div className={styles.medInfo}>
                                  <div className={styles.medNameRow}>
                                    <p className={styles.medName}>{med.name}</p>
                                    <span className={styles.medDosage}>
                                      {med.dosage}
                                    </span>
                                  </div>
                                  <p className={styles.medDose}>{med.dose}</p>
                                  <p className={styles.medTiming}>
                                    {med.mealTiming}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.quickGuide}>
        <h3 className={styles.quickGuideTitle}>Quick Guide</h3>
        <div className={styles.quickGuideContent}>
          <div className={styles.quickGuideItem}>
            <div className={styles.quickGuideTodayIndicator}></div>
            <span className={styles.quickGuideLabel}>Today&apos;s column</span>
          </div>
          <div className={styles.quickGuideItem}>
            <div
              className={clsx(
                styles.checkbox,
                styles.checkboxChecked,
                styles.checkboxSmall,
              )}
            >
              <CheckIcon className={styles.checkIcon} />
            </div>
            <span className={styles.quickGuideLabel}>Taken medication</span>
          </div>
          <div className={styles.quickGuideItem}>
            <div className={clsx(styles.checkbox, styles.checkboxSmall)}></div>
            <span className={styles.quickGuideLabel}>
              Click checkbox to mark as taken
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Icon component
type IconProps = {
  className?: string;
};

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}
