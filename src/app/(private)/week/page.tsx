import { redirect } from "next/navigation";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./week.module.css";

type MedicationItem = {
  id: string;
  name: string;
  dose: string;
  mealTiming: "before" | "with" | "after" | "any";
  isTaken?: boolean;
};

type TimeSlot = {
  time: string;
  medications: MedicationItem[];
};

// Mock data for the week view
const MOCK_WEEK_DATA: Record<string, TimeSlot[]> = {
  "2025-11-10": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
    {
      time: "08:00",
      medications: [
        { id: "2", name: "Aspirin", dose: "75mg", mealTiming: "with" },
        { id: "3", name: "Metformin", dose: "500mg", mealTiming: "with" },
        { id: "4", name: "Lisinopril", dose: "10mg", mealTiming: "any" },
      ],
    },
    {
      time: "12:00",
      medications: [
        {
          id: "5",
          name: "Calcium Carbonate",
          dose: "600mg",
          mealTiming: "with",
        },
        { id: "6", name: "Vitamin D3", dose: "2000 IU", mealTiming: "with" },
      ],
    },
    {
      time: "16:00",
      medications: [
        { id: "7", name: "Amlodipine", dose: "5mg", mealTiming: "any" },
      ],
    },
    {
      time: "19:00",
      medications: [
        {
          id: "8",
          name: "Calcium Carbonate",
          dose: "600mg",
          mealTiming: "with",
        },
        { id: "9", name: "Atorvastatin", dose: "20mg", mealTiming: "after" },
      ],
    },
    {
      time: "20:00",
      medications: [
        { id: "10", name: "Metformin", dose: "500mg", mealTiming: "with" },
        { id: "11", name: "Simvastatin", dose: "20mg", mealTiming: "with" },
      ],
    },
    {
      time: "21:30",
      medications: [
        { id: "12", name: "Melatonin", dose: "3mg", mealTiming: "any" },
      ],
    },
  ],
  "2025-11-11": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-12": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-13": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-14": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
    {
      time: "16:00",
      medications: [
        { id: "7", name: "Amlodipine", dose: "5mg", mealTiming: "any" },
      ],
    },
  ],
  "2025-11-15": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
  "2025-11-16": [
    {
      time: "07:30",
      medications: [
        { id: "1", name: "Omeprazole", dose: "20mg", mealTiming: "before" },
      ],
    },
  ],
};

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

  // Get all unique time slots from the week data
  const allTimeSlots = new Set<string>();
  Object.values(MOCK_WEEK_DATA).forEach((dayData) => {
    dayData.forEach((slot) => allTimeSlots.add(slot.time));
  });
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

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
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.timeHeader}>Time</th>
                  {weekDays.map((day, index) => {
                    const dayKey = formatDate(day, "yyyy-MM-dd");
                    const todayKey = formatDate(today, "yyyy-MM-dd");
                    const isToday = dayKey === todayKey;
                    return (
                      <th
                        key={dayKey}
                        className={clsx(
                          styles.dayHeader,
                          isToday && styles.dayHeaderToday,
                        )}
                      >
                        <div className={styles.dayName}>
                          {formatDate(day, "EEE")}
                        </div>
                        <div
                          className={clsx(
                            styles.dayNumber,
                            isToday && styles.dayNumberToday,
                          )}
                        >
                          {formatDate(day, "d")}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedTimeSlots.map((time) => (
                  <tr key={time}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeText}>{time}</div>
                    </td>
                    {weekDays.map((day) => {
                      const dayKey = formatDate(day, "yyyy-MM-dd");
                      const dayData = MOCK_WEEK_DATA[dayKey] || [];
                      const slot = dayData.find((s) => s.time === time);
                      const medications = slot?.medications || [];

                      return (
                        <td
                          key={`${dayKey}-${time}`}
                          className={styles.dayCell}
                        >
                          <div className={styles.medicationsList}>
                            {medications.map((med) => (
                              <div key={med.id} className={styles.medCard}>
                                <button
                                  type="button"
                                  className={clsx(
                                    styles.checkbox,
                                    med.isTaken && styles.checkboxChecked,
                                  )}
                                  aria-label={`Mark ${med.name} as ${med.isTaken ? "not taken" : "taken"}`}
                                >
                                  {med.isTaken && (
                                    <CheckIcon className={styles.checkIcon} />
                                  )}
                                </button>
                                <div className={styles.medInfo}>
                                  <p className={styles.medName}>{med.name}</p>
                                  <p className={styles.medDose}>{med.dose}</p>
                                  <p className={styles.medTiming}>
                                    {med.mealTiming}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.quickGuide}>
          <h3 className={styles.quickGuideTitle}>Quick Guide</h3>
          <div className={styles.quickGuideContent}>
            <div className={styles.quickGuideItem}>
              <div className={styles.quickGuideTodayIndicator}></div>
              <span className={styles.quickGuideLabel}>
                Today&apos;s column
              </span>
            </div>
            <div className={styles.quickGuideItem}>
              <div
                className={clsx(
                  styles.checkbox,
                  styles.checkboxChecked,
                  styles.checkboxSmall,
                )}
              >
                <CheckIcon className={styles.checkIcon} />
              </div>
              <span className={styles.quickGuideLabel}>Taken medication</span>
            </div>
            <div className={styles.quickGuideItem}>
              <div
                className={clsx(styles.checkbox, styles.checkboxSmall)}
              ></div>
              <span className={styles.quickGuideLabel}>
                Click checkbox to mark as taken
              </span>
            </div>
          </div>
        </div>
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
