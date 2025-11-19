"use client";

import { useRouter } from "next/navigation";
import styles from "./today.module.css";

type CalendarNavigationProps = {
  calendarYear: number;
  calendarMonth: number;
  selectedDate: Date;
};

export function CalendarNavigation({
  calendarYear,
  calendarMonth,
  selectedDate,
}: CalendarNavigationProps) {
  const router = useRouter();

  const formatDateForUrl = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatMonthForUrl = (year: number, month: number): string => {
    const monthStr = String(month + 1).padStart(2, "0");
    return `${year}-${monthStr}`;
  };

  const handlePreviousMonth = () => {
    // Navigate to previous month, keeping the selected date unchanged
    const prevMonthDate = new Date(calendarYear, calendarMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const dateStr = formatDateForUrl(selectedDate);
    const monthStr = formatMonthForUrl(prevYear, prevMonth);
    router.push(`/today?date=${dateStr}&month=${monthStr}`);
  };

  const handleNextMonth = () => {
    // Navigate to next month, keeping the selected date unchanged
    const nextMonthDate = new Date(calendarYear, calendarMonth + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth();

    const dateStr = formatDateForUrl(selectedDate);
    const monthStr = formatMonthForUrl(nextYear, nextMonth);
    router.push(`/today?date=${dateStr}&month=${monthStr}`);
  };

  return (
    <div className={styles.calendarHeader}>
      <button
        type="button"
        className={styles.calendarNav}
        aria-label="Previous month"
        onClick={handlePreviousMonth}
      >
        <ArrowLeftIcon className={styles.navIcon} />
      </button>
      <h4 className={styles.calendarTitle}>
        {formatCalendarTitle(calendarYear, calendarMonth)}
      </h4>
      <button
        type="button"
        className={styles.calendarNav}
        aria-label="Next month"
        onClick={handleNextMonth}
      >
        <ArrowRightIcon className={styles.navIcon} />
      </button>
    </div>
  );
}

function formatCalendarTitle(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

type IconProps = {
  className?: string;
};

function ArrowLeftIcon({ className }: IconProps) {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
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
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
