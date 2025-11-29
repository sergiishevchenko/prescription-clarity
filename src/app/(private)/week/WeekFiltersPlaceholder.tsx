"use client";

import clsx from "clsx";
import { WeekFilters } from "./WeekFilters";
import { useWeekFilters } from "./WeekFilterContext";
import { useFilterToggle } from "./FilterToggleWrapper";
import styles from "./week.module.css";

export function WeekFiltersPlaceholder() {
  const { setStatusFilter, setMealTimingFilter } = useWeekFilters();
  const { isOpen } = useFilterToggle();

  const handleFilterChange = (
    newStatusFilter: "all" | "taken" | "missed",
    newMealTimingFilter: "all" | "before" | "with" | "after",
  ) => {
    setStatusFilter(newStatusFilter);
    setMealTimingFilter(newMealTimingFilter);
  };

  return (
    <div
      className={clsx(
        styles.filtersContainer,
        isOpen && styles.filtersContainerVisible,
      )}
    >
      <WeekFilters onFilterChange={handleFilterChange} />
    </div>
  );
}
