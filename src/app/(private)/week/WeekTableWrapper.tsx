"use client";

import { WeekScheduleTable } from "./WeekScheduleTable";
import styles from "./week.module.css";
import type { ScheduleEntryItem } from "@/lib/schedule";
import { useWeekFilters } from "./WeekFilterContext";

type WeekTableWrapperProps = {
  initialEntries: ScheduleEntryItem[];
  weekDays: Date[];
  today: Date;
};

export function WeekTableWrapper({
  initialEntries,
  weekDays,
  today,
}: WeekTableWrapperProps) {
  const { statusFilter, mealTimingFilter } = useWeekFilters();

  return (
    <div className={styles.contentWrapper}>
      <WeekScheduleTable
        initialEntries={initialEntries}
        weekDays={weekDays}
        today={today}
        statusFilter={statusFilter}
        mealTimingFilter={mealTimingFilter}
      />
    </div>
  );
}
