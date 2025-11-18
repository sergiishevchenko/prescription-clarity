import { redirect } from "next/navigation";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./today.module.css";
import { getScheduleEntries, type ScheduleEntryItem } from "@/lib/schedule";
import { ScheduleList } from "./ScheduleList";

type CalendarStatus = "AllTaken" | "Partial" | "Scheduled" | "Missed" | "None";

type CalendarDay = {
  value: number;
  status: CalendarStatus;
  isToday?: boolean;
};

// Static calendar data (can be enhanced later with actual API data)
const calendarDays: CalendarDay[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const statusMap: Record<number, CalendarStatus> = {
    5: "Missed",
    6: "Missed",
    7: "Partial",
    8: "Partial",
    9: "Scheduled",
    10: "Scheduled",
    11: "AllTaken",
    12: "AllTaken",
    13: "AllTaken",
    14: "Partial",
    15: "AllTaken",
    16: "Scheduled",
    17: "Scheduled",
    18: "AllTaken",
  };
  return {
    value: day,
    status: statusMap[day] ?? "None",
    isToday: day === 13,
  };
});

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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return { short, weekday, full };
}

function statusClass(status: CalendarStatus) {
  if (status === "None") return undefined;
  return styles[`calendarDay${status}` as keyof typeof styles];
}

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.name?.trim() ||
    user.email?.split("@")[0]?.replace(/\./g, " ") ||
    "Patient";
  const today = new Date();
  const { full, short, weekday } = formatDateParts(today);

  // Fetch today's schedule entries
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
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

  return (
    <div className={styles.page}>
      <div className={styles.outer}>
        <header className={styles.stickyHeader}>
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
        </header>

        <div className={styles.content}>
          <ScheduleList initialEntries={scheduleEntries} />

          <nav className={styles.dayControls} aria-label="Day selector">
            <button
              type="button"
              className={styles.navArrow}
              aria-label="Previous day"
            >
              <ArrowLeftIcon className={styles.navIcon} />
            </button>
            <button type="button" className={styles.dateButton}>
              <span className={styles.datePrimary}>{short}</span>
              <span className={styles.dateSecondary}>{weekday}</span>
            </button>
            <button
              type="button"
              className={styles.navArrow}
              aria-label="Next day"
            >
              <ArrowRightIcon className={styles.navIcon} />
            </button>
          </nav>

          <section
            className={styles.calendarSection}
            aria-label="Monthly overview"
          >
            <div className={styles.calendarHeader}>
              <button
                type="button"
                className={styles.calendarNav}
                aria-label="Previous month"
              >
                <ArrowLeftIcon className={styles.navIcon} />
              </button>
              <h4 className={styles.calendarTitle}>November 2025</h4>
              <button
                type="button"
                className={styles.calendarNav}
                aria-label="Next month"
              >
                <ArrowRightIcon className={styles.navIcon} />
              </button>
            </div>
            <div className={styles.weekdays}>
              {"SMTWTFS".split("").map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className={styles.calendarGrid}>
              {calendarDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={clsx(
                    styles.calendarDay,
                    day.isToday && styles.calendarDayToday,
                    statusClass(day.status),
                  )}
                >
                  {day.value}
                </button>
              ))}
            </div>
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

type IconProps = {
  className?: string;
};

function CheckIcon({ className }: IconProps) {
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
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}

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

function MoonIcon({ className }: IconProps) {
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
}

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
