import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./week.module.css";
import { getScheduleEntries, type ScheduleEntryItem } from "@/lib/schedule";
import { WeekFilterProvider } from "./WeekFilterContext";
import { WeekFiltersPlaceholder } from "./WeekFiltersPlaceholder";
import { WeekTableWrapper } from "./WeekTableWrapper";
import { PrintButton } from "./PrintButton";
import { FilterToggleWrapper } from "./FilterToggleWrapper";
import { HeaderButtons } from "./HeaderButtons";

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

type WeekPageProps = {
  searchParams: Promise<{ week?: string; userId?: string; name?: string }>;
};

export default async function WeekPage({ searchParams }: WeekPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const today = new Date();
  const params = await searchParams;
  const targetUserId = params.userId || user.id;
  const targetNameFromQuery = params.name;
  const isOwnSchedule = targetUserId === user.id;

  let referenceDate: Date;
  if (params.week) {
    const [year, month, day] = params.week.split("-").map(Number);
    if (
      !isNaN(year) &&
      !isNaN(month) &&
      !isNaN(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      referenceDate = new Date(year, month - 1, day);
    } else {
      referenceDate = new Date(today);
    }
  } else {
    referenceDate = new Date(today);
  }

  const weekDays = getWeekDays(new Date(referenceDate));
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekRange = `${formatDate(weekStart, "MMM d")} - ${formatDate(weekEnd, "MMM d")}`;

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const prevWeekParam = formatDate(prevWeekStart, "yyyy-MM-dd");
  const nextWeekParam = formatDate(nextWeekStart, "yyyy-MM-dd");

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
      targetUserId,
    );
  } catch (error) {
    console.error("Failed to load schedule entries:", error);
    scheduleEntries = [];
  }

  return (
    <WeekFilterProvider>
      <FilterToggleWrapper>
        <div className={styles.page}>
          <header className={styles.stickyHeader}>
            <div className={styles.headerInner}>
              <div className={styles.headerTop}>
                <div>
                  <h1 className={styles.title}>Week View</h1>
                  {!isOwnSchedule && (
                    <p className="mt-1 text-xs text-slate-500">
                      Viewing schedule for{" "}
                      <span className="font-semibold text-slate-900">
                        {targetNameFromQuery || user.name || user.email}
                      </span>
                    </p>
                  )}
                </div>
                <HeaderButtons>
                  {isOwnSchedule && (
                    <PrintButton
                      weekStart={weekStart}
                      weekEnd={weekEnd}
                      timezone={timezone}
                    />
                  )}
                </HeaderButtons>
              </div>
              <div className={styles.weekNavigation}>
                <Link
                  href={`/week?week=${prevWeekParam}`}
                  className={styles.navButton}
                  aria-label="Previous week"
                >
                  <ChevronLeftIcon className={styles.navIcon} />
                  <span className={styles.navText}>Previous</span>
                </Link>
                <div className={styles.weekRange}>{weekRange}</div>
                <Link
                  href={`/week?week=${nextWeekParam}`}
                  className={styles.navButton}
                  aria-label="Next week"
                >
                  <span className={styles.navText}>Next</span>
                  <ChevronRightIcon className={styles.navIcon} />
                </Link>
              </div>
              <WeekFiltersPlaceholder />
            </div>
          </header>

          <WeekTableWrapper
            initialEntries={scheduleEntries}
            weekDays={weekDays}
            today={today}
          />
        </div>
      </FilterToggleWrapper>
    </WeekFilterProvider>
  );
}

// Icon components
type IconProps = {
  className?: string;
};

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
