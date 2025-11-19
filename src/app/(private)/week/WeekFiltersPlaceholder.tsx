"use client";

import { WeekFilters } from "./WeekFilters";
import { useWeekFilters } from "./WeekFilterContext";

export function WeekFiltersPlaceholder() {
  const { setStatusFilter, setMealTimingFilter } = useWeekFilters();

  const handleFilterChange = (
    newStatusFilter: "all" | "taken" | "missed",
    newMealTimingFilter: "all" | "before" | "with" | "after",
  ) => {
    setStatusFilter(newStatusFilter);
    setMealTimingFilter(newMealTimingFilter);
  };

  return <WeekFilters onFilterChange={handleFilterChange} />;
}
