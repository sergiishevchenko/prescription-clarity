"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  ScheduleManager,
  type MealFilter,
  type SortDirection,
  type SortField,
  type StatusFilter,
} from "./ScheduleManager";
import type { ScheduleCardData } from "./types";
import styles from "./schedule.module.css";

type ScheduleShellProps = {
  initialSchedules: ScheduleCardData[];
};

export function ScheduleShell({ initialSchedules }: ScheduleShellProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialSchedules.length);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const advancedFiltersActive = useMemo(() => {
    return !(
      statusFilter === "all" &&
      mealFilter === "all" &&
      sortField === "name" &&
      sortDirection === "asc"
    );
  }, [statusFilter, mealFilter, sortField, sortDirection]);

  const resetFilters = () => {
    setStatusFilter("all");
    setMealFilter("all");
    setSortField("name");
    setSortDirection("asc");
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updatePlaceholder = () => {
      if (searchInputRef.current) {
        if (window.innerWidth <= 768) {
          searchInputRef.current.placeholder = "Search schedules...";
        } else {
          searchInputRef.current.placeholder =
            "Search schedules by medication, dosage, or timing...";
        }
      }
    };

    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className={styles.heroTopLeft}>
              <div className={styles.heroTopRow}>
                <h1>Schedule</h1>
                <div className={styles.heroActions}>
                  {/* <button
                    type="button"
                    className={clsx(styles.heroButton, styles.heroSecondary)}
                  >
                    <DownloadIcon
                      className={styles.heroButtonIcon}
                      aria-hidden="true"
                    />
                    <span>Export</span>
                  </button> */}
                  <Link
                    href="/medications/new"
                    className={clsx(styles.heroButton, styles.heroPrimary)}
                  >
                    <PlusIcon
                      className={styles.heroButtonIcon}
                      aria-hidden="true"
                    />
                    <span className={styles.heroButtonTextFull}>
                      Add&nbsp;Schedule
                    </span>
                    <span className={styles.heroButtonTextMobile}>Add</span>
                  </Link>
                </div>
              </div>
              <p>
                Manage recurring reminders, edit dose timing, and regenerate
                plans.
              </p>
            </div>
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <div className={styles.searchInputContainer}>
                <span className={styles.searchIcon}>
                  <SearchIcon
                    className={styles.searchIconIcon}
                    aria-hidden="true"
                  />
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search schedules by medication, dosage, or timing..."
                  className={styles.searchInput}
                />
              </div>
              <p className={styles.searchMeta}>
                {visibleCount} of {initialSchedules.length} schedules visible
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={clsx(
                styles.heroButton,
                styles.heroSecondary,
                styles.filtersToggleButton,
                advancedFiltersActive && styles.filtersToggleActive,
                filtersOpen &&
                  !advancedFiltersActive &&
                  styles.filtersToggleOpen,
              )}
            >
              <FilterIcon
                className={styles.heroButtonIcon}
                aria-hidden="true"
              />
              <span className={styles.filtersButtonTextFull}>
                {filtersOpen ? "Hide filters" : "Filters"}
              </span>
            </button>
          </div>
          {filtersOpen ? (
            <div className={styles.filtersPanel}>
              <div className={styles.filtersHeader}>
                <div className={styles.filtersHeaderRow}>
                  <p className={styles.filtersTitle}>Advanced filters</p>
                  <button
                    type="button"
                    className={styles.filtersResetButton}
                    onClick={resetFilters}
                  >
                    Reset
                  </button>
                </div>
                <p className={styles.filtersSubtitle}>
                  Narrow down by status, meal timing, and schedule order.
                </p>
              </div>
              <div className={styles.filtersGrid}>
                <label className={styles.filtersLabel}>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className={styles.filtersSelect}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label className={styles.filtersLabel}>
                  Meal timing
                  <select
                    value={mealFilter}
                    onChange={(event) =>
                      setMealFilter(event.target.value as MealFilter)
                    }
                    className={styles.filtersSelect}
                  >
                    <option value="all">All timings</option>
                    <option value="before">Before meal</option>
                    <option value="with">With meal</option>
                    <option value="after">After meal</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </label>
                <label className={styles.filtersLabel}>
                  Sort by
                  <select
                    value={sortField}
                    onChange={(event) =>
                      setSortField(event.target.value as SortField)
                    }
                    className={styles.filtersSelect}
                  >
                    <option value="name">Name</option>
                    <option value="start">Start date</option>
                  </select>
                </label>
                <div className={styles.filtersLabel}>
                  Sort direction
                  <button
                    type="button"
                    onClick={() =>
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc",
                      )
                    }
                    className={styles.sortButton}
                  >
                    {sortDirection === "asc" ? (
                      <>
                        <ArrowUpIcon className={styles.sortIcon} />
                        Ascending
                      </>
                    ) : (
                      <>
                        <ArrowDownIcon className={styles.sortIcon} />
                        Descending
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.sectionStack}>
          <ScheduleManager
            initialSchedules={initialSchedules}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            mealFilter={mealFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onVisibleCountChange={setVisibleCount}
          />
        </div>
      </div>
    </>
  );
}

type IconProps = {
  className?: string;
};

/*function DownloadIcon({ className }: IconProps) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}*/

function PlusIcon({ className }: IconProps) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon({ className }: IconProps) {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ArrowUpIcon({ className }: IconProps) {
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
      <path d="M12 19V5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon({ className }: IconProps) {
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
      <path d="M12 5v14" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}
