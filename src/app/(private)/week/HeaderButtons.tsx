"use client";

import Link from "next/link";
import { FilterToggleButton } from "./FilterToggleButton";
import { useFilterToggle } from "./FilterToggleWrapper";
import { useWeekFilters } from "./WeekFilterContext";
import styles from "./week.module.css";

type CalendarIconProps = {
  className?: string;
};

function CalendarIcon({ className }: CalendarIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

type HeaderButtonsProps = {
  children: React.ReactNode;
};

export function HeaderButtons({ children }: HeaderButtonsProps) {
  const { isOpen, setIsOpen } = useFilterToggle();
  const { statusFilter, mealTimingFilter } = useWeekFilters();
  const hasActiveFilters = statusFilter !== "all" || mealTimingFilter !== "all";

  return (
    <div className={styles.headerButtons}>
      {children}
      <Link
        href="/week"
        className={styles.todayButton}
        aria-label="Go to current week"
      >
        <CalendarIcon className={styles.calendarIcon} />
        <span>Today</span>
      </Link>
      <FilterToggleButton
        isOpen={isOpen}
        hasActiveFilters={hasActiveFilters}
        onToggle={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}
