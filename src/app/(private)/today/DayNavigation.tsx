"use client";

import { useRouter } from "next/navigation";
import styles from "./today.module.css";

type DayNavigationProps = {
  selectedDate: Date;
  today: Date;
  short: string;
  weekday: string;
};

export function DayNavigation({
  selectedDate,
  today,
  short,
  weekday,
}: DayNavigationProps) {
  const router = useRouter();

  const formatDateForUrl = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const navigateToDate = (targetDate: Date) => {
    const dateStr = formatDateForUrl(targetDate);
    router.push(`/today?date=${dateStr}`);
  };

  const handlePreviousDay = () => {
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    navigateToDate(previousDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    navigateToDate(nextDate);
  };

  const handleDateButtonClick = () => {
    // Navigate to today if not already there
    const todayStr = formatDateForUrl(today);
    const selectedStr = formatDateForUrl(selectedDate);
    if (todayStr !== selectedStr) {
      router.push("/today");
    }
  };

  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  return (
    <nav className={styles.dayControls} aria-label="Day selector">
      <button
        type="button"
        className={styles.navArrow}
        aria-label="Previous day"
        onClick={handlePreviousDay}
      >
        <ArrowLeftIcon className={styles.navIcon} />
      </button>
      <button
        type="button"
        className={styles.dateButton}
        onClick={handleDateButtonClick}
        title={isToday ? "Today" : "Click to go to today"}
      >
        {isToday ? (
          <>
            <span className={styles.datePrimary}>{short}</span>
            <span className={styles.dateSecondary}>{weekday}</span>
          </>
        ) : (
          <span className={styles.datePrimary}>Today</span>
        )}
      </button>
      <button
        type="button"
        className={styles.navArrow}
        aria-label="Next day"
        onClick={handleNextDay}
      >
        <ArrowRightIcon className={styles.navIcon} />
      </button>
    </nav>
  );
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
