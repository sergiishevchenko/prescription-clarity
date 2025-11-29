import { redirect } from "next/navigation";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./today.module.css";
import {
  getScheduleEntries,
  getDayStatuses,
  type ScheduleEntryItem,
} from "@/lib/schedule";
import { ScheduleList } from "./ScheduleList";
import { DayNavigation } from "./DayNavigation";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarNavigation } from "./CalendarNavigation";

type CalendarStatus = "AllTaken" | "Partial" | "Scheduled" | "Missed" | "None";

type CalendarDay = {
  value: number | null;
  status: CalendarStatus;
  isToday?: boolean;
  isSelected?: boolean;
};

/**
 * Map database DayStatusType to CalendarStatus
 */
function mapDayStatusToCalendar(status: string | undefined): CalendarStatus {
  switch (status) {
    case "ALL_TAKEN":
      return "AllTaken";
    case "PARTIAL":
      return "Partial";
    case "SCHEDULED":
      return "Scheduled";
    case "MISSED":
      return "Missed";
    case "NONE":
    default:
      return "None";
  }
}

function generateCalendarDays(
  year: number,
  month: number,
  today: Date,
  selectedDate: Date,
  statusMap: Record<string, string> = {},
): CalendarDay[] {
  // Get first day of the month
  const firstDay = new Date(year, month, 1);
  // Get last day of the month (day 0 of next month)
  const lastDay = new Date(year, month + 1, 0);

  // Get day of week for first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = firstDay.getDay();
  // Number of days in the month
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  // Add empty cells before the first day of the month
  // Week starts with Monday, so:
  // - If first day is Sunday (0), we need 6 empty cells
  // - If first day is Monday (1), we need 0 empty cells
  // - If first day is Tuesday (2), we need 1 empty cell, etc.
  const emptyCells = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  for (let i = 0; i < emptyCells; i++) {
    days.push({
      value: null,
      status: "None",
      isToday: false,
    });
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const isToday =
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
    const isSelected =
      currentDate.getDate() === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear();

    // Format date as YYYY-MM-DD for status lookup
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayStatus = statusMap[dateKey];
    const status = mapDayStatusToCalendar(dayStatus);

    days.push({
      value: day,
      status,
      isToday,
      isSelected,
    });
  }

  return days;
}

const legendItems = [
  { label: "All taken", className: styles.legendSwatchSuccess },
  { label: "Partial", className: styles.legendSwatchWarning },
  { label: "Scheduled", className: styles.legendSwatchInfo },
  { label: "Missed", className: styles.legendSwatchDanger },
];

function formatDateParts(date: Date) {
  const short = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    date,
  );
  const full = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return { short, weekday, full };
}

export const dynamic = "force-dynamic";

type TodayPageProps = {
  searchParams: Promise<{ date?: string; month?: string }>;
};

export default async function TodayPage({ searchParams }: TodayPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  // Parse date from search params (YYYY-MM-DD format) or default to today
  let selectedDate: Date;
  if (params.date) {
    // Parse YYYY-MM-DD format in local timezone
    const [year, month, day] = params.date.split("-").map(Number);
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      redirect("/today");
    }
    selectedDate = new Date(year, month - 1, day);
    // Ensure valid date
    if (isNaN(selectedDate.getTime())) {
      redirect("/today");
    }
  } else {
    selectedDate = new Date();
  }

  // Parse month from search params (YYYY-MM format) for calendar view
  // If not provided, use the selected date's month
  let calendarYear: number;
  let calendarMonth: number;
  if (params.month) {
    const [year, month] = params.month.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      // Invalid month param, use selected date's month
      calendarYear = selectedDate.getFullYear();
      calendarMonth = selectedDate.getMonth();
    } else {
      calendarYear = year;
      calendarMonth = month - 1; // Convert to 0-indexed
    }
  } else {
    // No month param, use selected date's month
    calendarYear = selectedDate.getFullYear();
    calendarMonth = selectedDate.getMonth();
  }

  /*const displayName =
    user.name?.trim() ||
    user.email?.split("@")[0]?.replace(/\./g, " ") ||
    "Patient";*/
  const today = new Date();
  const { short, weekday } = formatDateParts(selectedDate); //full, not used

  // Fetch selected day's schedule entries
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get user's timezone (default to UTC, can be enhanced later)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let scheduleEntries: ScheduleEntryItem[] = [];
  try {
    scheduleEntries = await getScheduleEntries(startOfDay, endOfDay, timezone);
  } catch (error) {
    console.error("Failed to load schedule entries:", error);
    scheduleEntries = [];
  }

  // Fetch day statuses for the calendar month
  const calendarStartDate = new Date(calendarYear, calendarMonth, 1);
  const calendarEndDate = new Date(calendarYear, calendarMonth + 1, 0);
  calendarEndDate.setHours(23, 59, 59, 999);

  let dayStatuses: Record<string, string> = {};
  try {
    dayStatuses = await getDayStatuses(
      calendarStartDate,
      calendarEndDate,
      timezone,
    );
  } catch (error) {
    console.error("Failed to load day statuses:", error);
    dayStatuses = {};
  }

  // Generate calendar for the specified month (or selected date's month if not specified)
  const calendarDays = generateCalendarDays(
    calendarYear,
    calendarMonth,
    today,
    selectedDate,
    dayStatuses,
  );

  return (
    <div className={styles.page}>
      <div className={styles.outer}>
        {/* <header className={styles.stickyHeader}>
          <div className={styles.headerInner}>
            <div className={styles.profileBlock}>
              <span className={styles.profileName}>{displayName}</span>
              <span className={styles.profileDate}>{full}</span>
            </div>
            <div className={styles.headerButtons}>
              <button
                type="button"
                className={clsx(styles.iconButton, styles.iconButtonPrimary)}
                aria-label="Print week schedule"
              >
                <PrintIcon className={styles.iconButtonIcon} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Toggle dark mode"
              >
                <MoonIcon className={styles.iconButtonIcon} />
              </button>
            </div>
          </div>
        </header> */}

        <div className={styles.content}>
          <ScheduleList
            initialEntries={scheduleEntries}
            selectedDate={selectedDate}
            today={today}
          />

          <DayNavigation
            selectedDate={selectedDate}
            today={today}
            short={short}
            weekday={weekday}
          />

          <section
            className={styles.calendarSection}
            aria-label="Monthly overview"
          >
            <CalendarNavigation
              calendarYear={calendarYear}
              calendarMonth={calendarMonth}
              selectedDate={selectedDate}
            />
            <div className={styles.weekdays}>
              {"MTWTFSS".split("").map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <CalendarGrid
              days={calendarDays}
              calendarYear={calendarYear}
              calendarMonth={calendarMonth}
            />
            <div className={styles.calendarLegend}>
              {legendItems.map((item) => (
                <div key={item.label} className={styles.legendItem}>
                  <span className={clsx(styles.legendSwatch, item.className)} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/*type IconProps = {
  className?: string;
};*/

/*function PrintIcon({ className }: IconProps) {
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
}*/

/*function MoonIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" />
    </svg>
  );
}*/
