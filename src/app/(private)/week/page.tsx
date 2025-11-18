import { redirect } from "next/navigation";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./week.module.css";
import { getScheduleEntries, type ScheduleEntryItem } from "@/lib/schedule";
import { WeekScheduleTable } from "./WeekScheduleTable";

export const dynamic = "force-dynamic";

// Generate week days (Monday to Sunday)
function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setDate(diff));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    days.push(dayDate);
  }
  return days;
}

function formatDate(
  date: Date,
  format: "MMM d" | "EEE" | "d" | "yyyy-MM-dd",
): string {
  if (format === "MMM d") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  }
  if (format === "EEE") {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  }
  if (format === "d") {
    return date.getDate().toString();
  }
  if (format === "yyyy-MM-dd") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

export default async function WeekPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const today = new Date();
  const weekDays = getWeekDays(new Date(today));
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekRange = `${formatDate(weekStart, "MMM d")} - ${formatDate(weekEnd, "MMM d")}`;

  // Fetch week's schedule entries
  const startOfWeek = new Date(weekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(weekEnd);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get user's timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let scheduleEntries: ScheduleEntryItem[] = [];
  try {
    scheduleEntries = await getScheduleEntries(
      startOfWeek,
      endOfWeek,
      timezone,
    );
  } catch (error) {
    console.error("Failed to load schedule entries:", error);
    scheduleEntries = [];
  }

  return (
    <div className={styles.page}>
      <header className={styles.stickyHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>Week View</h1>
            <div className={styles.headerButtons}>
              <button
                type="button"
                className={styles.printButton}
                aria-label="Print week schedule"
              >
                <PrintIcon className={styles.printIcon} />
                <span className={styles.printText}>Print</span>
              </button>
              <button
                type="button"
                className={styles.todayButton}
                aria-label="Go to today"
              >
                <CalendarIcon className={styles.calendarIcon} />
                <span>Today</span>
              </button>
            </div>
          </div>
          <div className={styles.weekNavigation}>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Previous week"
            >
              <ChevronLeftIcon className={styles.navIcon} />
              <span className={styles.navText}>Previous</span>
            </button>
            <div className={styles.weekRange}>{weekRange}</div>
            <button
              type="button"
              className={styles.navButton}
              aria-label="Next week"
            >
              <span className={styles.navText}>Next</span>
              <ChevronRightIcon className={styles.navIcon} />
            </button>
          </div>
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={clsx(styles.filterButton, styles.filterButtonActive)}
              >
                All
              </button>
              <button type="button" className={styles.filterButton}>
                Taken
              </button>
              <button type="button" className={styles.filterButton}>
                Missed
              </button>
            </div>
            <div className={styles.filterDivider}></div>
            <div className={styles.filterGroup}>
              <button
                type="button"
                className={clsx(styles.filterButton, styles.filterButtonActive)}
              >
                All Meals
              </button>
              <button type="button" className={styles.filterButton}>
                Before
              </button>
              <button type="button" className={styles.filterButton}>
                With
              </button>
              <button type="button" className={styles.filterButton}>
                After
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.contentWrapper}>
        <WeekScheduleTable
          initialEntries={scheduleEntries}
          weekDays={weekDays}
          today={today}
        />
      </div>
    </div>
  );
}

// Icon components
type IconProps = {
  className?: string;
};

function PrintIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
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

function ChevronLeftIcon({ className }: IconProps) {
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

function ChevronRightIcon({ className }: IconProps) {
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
