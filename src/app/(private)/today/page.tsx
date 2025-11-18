import { redirect } from "next/navigation";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./today.module.css";

type ScheduleContext = "before" | "with" | "anytime" | "after" | "taken";

type ScheduleItem = {
  id: string;
  name: string;
  dose: string;
  time: string;
  context: ScheduleContext;
};

type CalendarStatus = "AllTaken" | "Partial" | "Scheduled" | "Missed" | "None";

type CalendarDay = {
  value: number;
  status: CalendarStatus;
  isToday?: boolean;
};

const activeSchedule: ScheduleItem[] = [
  {
    id: "omeprazole",
    name: "Omeprazole",
    dose: "20 mg",
    time: "07:30",
    context: "before",
  },
  {
    id: "aspirin",
    name: "Aspirin",
    dose: "75 mg",
    time: "08:00",
    context: "with",
  },
  {
    id: "lisinopril",
    name: "Lisinopril",
    dose: "10 mg",
    time: "08:00",
    context: "anytime",
  },
  {
    id: "metformin",
    name: "Metformin",
    dose: "500 mg",
    time: "08:00",
    context: "with",
  },
  {
    id: "calcium",
    name: "Calcium Carbonate",
    dose: "600 mg",
    time: "12:00",
    context: "with",
  },
  {
    id: "vitd3",
    name: "Vitamin D3",
    dose: "2000 IU",
    time: "12:00",
    context: "with",
  },
  {
    id: "amlodipine",
    name: "Amlodipine",
    dose: "5 mg",
    time: "16:00",
    context: "anytime",
  },
  {
    id: "atorvastatin",
    name: "Atorvastatin",
    dose: "20 mg",
    time: "19:00",
    context: "after",
  },
];

const completedSchedule: ScheduleItem[] = [
  {
    id: "simvastatin",
    name: "Simvastatin",
    dose: "20 mg",
    time: "20:00",
    context: "taken",
  },
  {
    id: "melatonin",
    name: "Melatonin",
    dose: "3 mg",
    time: "21:30",
    context: "taken",
  },
];

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

const contextLabels: Record<ScheduleContext, string> = {
  before: "before meal",
  with: "with meal",
  anytime: "anytime",
  after: "after meal",
  taken: "taken",
};

const contextClassMap: Record<ScheduleContext, string | undefined> = {
  before: styles.contextBefore,
  with: styles.contextWith,
  anytime: styles.contextAnytime,
  after: styles.contextAfter,
  taken: styles.contextTaken,
};

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

function formatPendingMessage(count: number) {
  if (count === 0) return "All caught up for today";
  if (count === 1) return "1 medication pending";
  return `${count} medications pending`;
}

function statusClass(status: CalendarStatus) {
  if (status === "None") return undefined;
  return styles[`calendarDay${status}` as keyof typeof styles];
}

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
  const pendingCount = activeSchedule.length;
  const completedCount = completedSchedule.length;

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
          <section className={styles.scheduleSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Today&apos;s Schedule</h2>
                <p className={styles.sectionSubtitle}>
                  {formatPendingMessage(pendingCount)} · {completedCount}{" "}
                  completed
                </p>
              </div>
              <button type="button" className={styles.markAllButton}>
                <CheckIcon className={styles.markAllIcon} />
                <span>Mark All</span>
              </button>
            </div>

            <ul className={styles.scheduleList}>
              {activeSchedule.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={styles.statusButton}
                    aria-label={`Mark ${item.name} as taken`}
                  >
                    <CheckIcon className={styles.statusIcon} />
                  </button>
                  <div className={styles.itemContent}>
                    <h3 className={styles.itemTitle}>{item.name}</h3>
                    <div className={styles.itemMeta}>
                      <span className={styles.dose}>{item.dose}</span>
                      <span className={styles.metaDot}>•</span>
                      <span className={styles.timeChip}>
                        <ClockIcon className={styles.metaIcon} />
                        {item.time}
                      </span>
                      <span className={styles.metaDot}>•</span>
                      <span
                        className={clsx(
                          styles.contextTag,
                          item.context && contextClassMap[item.context],
                        )}
                      >
                        {contextLabels[item.context]}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.moreButton}
                    aria-label="More actions"
                  >
                    <MoreIcon className={styles.moreIcon} />
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.sectionDivider}>
              <span>Done</span>
              <div className={styles.dividerLine} aria-hidden />
            </div>

            <ul className={clsx(styles.scheduleList, styles.completedList)}>
              {completedSchedule.map((item) => (
                <li key={item.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={clsx(
                      styles.statusButton,
                      styles.statusButtonCompleted,
                    )}
                    aria-label={`Mark ${item.name} as not taken`}
                  >
                    <UndoIcon className={styles.statusIcon} />
                  </button>
                  <div className={styles.itemContent}>
                    <h3 className={styles.itemTitle}>{item.name}</h3>
                    <div className={styles.itemMeta}>
                      <span className={styles.timeChip}>
                        <ClockIcon className={styles.metaIcon} />
                        {item.time}
                      </span>
                      <span className={styles.metaDot}>•</span>
                      <span
                        className={clsx(
                          styles.contextTag,
                          contextClassMap[item.context],
                        )}
                      >
                        {contextLabels[item.context]}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.moreButton}
                    aria-label="More actions"
                  >
                    <MoreIcon className={styles.moreIcon} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

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
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UndoIcon({ className }: IconProps) {
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
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-6.7l-3 3.7" />
    </svg>
  );
}

function MoreIcon({ className }: IconProps) {
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
      <path d="M12 7h.01" />
      <path d="M12 12h.01" />
      <path d="M12 17h.01" />
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

function ClockIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
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
