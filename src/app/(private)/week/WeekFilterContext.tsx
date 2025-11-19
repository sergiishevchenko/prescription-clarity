"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type StatusFilter = "all" | "taken" | "missed";
type MealTimingFilter = "all" | "before" | "with" | "after";

type WeekFilterContextType = {
  statusFilter: StatusFilter;
  mealTimingFilter: MealTimingFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  setMealTimingFilter: (filter: MealTimingFilter) => void;
};

const WeekFilterContext = createContext<WeekFilterContextType | undefined>(
  undefined,
);

export function WeekFilterProvider({ children }: { children: ReactNode }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mealTimingFilter, setMealTimingFilter] =
    useState<MealTimingFilter>("all");

  return (
    <WeekFilterContext.Provider
      value={{
        statusFilter,
        mealTimingFilter,
        setStatusFilter,
        setMealTimingFilter,
      }}
    >
      {children}
    </WeekFilterContext.Provider>
  );
}

export function useWeekFilters() {
  const context = useContext(WeekFilterContext);
  if (context === undefined) {
    throw new Error("useWeekFilters must be used within WeekFilterProvider");
  }
  return context;
}
