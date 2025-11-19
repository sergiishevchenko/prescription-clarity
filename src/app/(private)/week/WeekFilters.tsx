"use client";

import { useState } from "react";
import clsx from "clsx";
import styles from "./week.module.css";

type StatusFilter = "all" | "taken" | "missed";
type MealTimingFilter = "all" | "before" | "with" | "after";

type WeekFiltersProps = {
  onFilterChange: (
    statusFilter: StatusFilter,
    mealTimingFilter: MealTimingFilter,
  ) => void;
};

export function WeekFilters({ onFilterChange }: WeekFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mealTimingFilter, setMealTimingFilter] =
    useState<MealTimingFilter>("all");

  const handleStatusFilter = (filter: StatusFilter) => {
    setStatusFilter(filter);
    onFilterChange(filter, mealTimingFilter);
  };

  const handleMealTimingFilter = (filter: MealTimingFilter) => {
    setMealTimingFilter(filter);
    onFilterChange(statusFilter, filter);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            statusFilter === "all" && styles.filterButtonActive,
          )}
          onClick={() => handleStatusFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            statusFilter === "taken" && styles.filterButtonActive,
          )}
          onClick={() => handleStatusFilter("taken")}
        >
          Taken
        </button>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            statusFilter === "missed" && styles.filterButtonActive,
          )}
          onClick={() => handleStatusFilter("missed")}
        >
          Missed
        </button>
      </div>
      <div className={styles.filterDivider}></div>
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            mealTimingFilter === "all" && styles.filterButtonActive,
          )}
          onClick={() => handleMealTimingFilter("all")}
        >
          All Meals
        </button>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            mealTimingFilter === "before" && styles.filterButtonActive,
          )}
          onClick={() => handleMealTimingFilter("before")}
        >
          Before
        </button>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            mealTimingFilter === "with" && styles.filterButtonActive,
          )}
          onClick={() => handleMealTimingFilter("with")}
        >
          With
        </button>
        <button
          type="button"
          className={clsx(
            styles.filterButton,
            mealTimingFilter === "after" && styles.filterButtonActive,
          )}
          onClick={() => handleMealTimingFilter("after")}
        >
          After
        </button>
      </div>
    </div>
  );
}
