"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import styles from "./today.module.css";

type CalendarStatus = "AllTaken" | "Partial" | "Scheduled" | "Missed" | "None";

type CalendarDay = {
  value: number | null;
  status: CalendarStatus;
  isToday?: boolean;
  isSelected?: boolean;
};

type CalendarGridProps = {
  days: CalendarDay[];
  calendarYear: number;
  calendarMonth: number;
};

function statusClass(status: CalendarStatus) {
  if (status === "None") return undefined;
  return styles[`calendarDay${status}` as keyof typeof styles];
}

export function CalendarGrid({
  days,
  calendarYear,
  calendarMonth,
}: CalendarGridProps) {
  const router = useRouter();

  const formatDateForUrl = (
    year: number,
    month: number,
    day: number,
  ): string => {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = formatDateForUrl(calendarYear, calendarMonth, day);
    // When clicking a date, update both the date and the month parameter
    // The month will be the month of the clicked date
    const clickedMonth = formatDateForUrl(
      calendarYear,
      calendarMonth,
      1,
    ).substring(0, 7); // YYYY-MM format
    router.push(`/today?date=${clickedDate}&month=${clickedMonth}`);
  };

  return (
    <div className={styles.calendarGrid}>
      {days.map((day, index) => (
        <button
          key={day.value ?? `empty-${index}`}
          type="button"
          className={clsx(
            styles.calendarDay,
            day.isToday && styles.calendarDayToday,
            day.value === null && styles.calendarDayEmpty,
            statusClass(day.status),
          )}
          disabled={day.value === null}
          onClick={() => day.value !== null && handleDateClick(day.value)}
        >
          {day.value}
          {day.isSelected && (
            <SelectedDateIcon className={styles.selectedDateIcon} />
          )}
        </button>
      ))}
    </div>
  );
}

type IconProps = {
  className?: string;
};

function SelectedDateIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
}
