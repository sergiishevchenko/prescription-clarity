"use client";

//import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWeekDays, formatWeekRange } from "@/lib/week";
import styles from "./dependents.module.css";

// --- Types for API data ---
type CareAccessUser = {
  id: string;
  email: string;
  name: string | null;
  dateOfBirth: string | null;
  age: number | null;
  adherence7Days?: number | null;
  adherence30Days?: number | null;
};

type CareAccessItem = {
  accessId: string;
  userId: string;
  user: CareAccessUser;
  grantedAt: string;
  updatedAt: string;
};

type CareAccessResponse = {
  viewers: CareAccessItem[];
  caringFor: CareAccessItem[];
};

type Medication = {
  id: string;
  name: string;
  dose: number | null;
  form: string | null;
};

type Dependent = {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  adherence30: number | null;
  medications: Medication[];
};

function HeartIcon({ className }: { className?: string }) {
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/*function TrendingUpIcon({ className }: { className?: string }) {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}*/

/*function AlertCircleIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}*/

/*function PlusIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}*/

/*function BarChartIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}*/

function PrinterIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

/*function EditIcon({ className }: { className?: string }) {
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
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}*/

/*function ChevronDownIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}*/

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/*function PencilIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}*/

/*function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}*/

/*function UsersIcon({ className }: { className?: string }) {
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
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}*/

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        style={{ opacity: 0.25 }}
      />
      <path
        fill="currentColor"
        style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function DependentCard({
  dependent,
  onPrint,
  isPrinting,
}: {
  dependent: Dependent;
  onPrint: () => void;
  isPrinting: boolean;
}) {
  const name = dependent.name;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.dependentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarFallback}>{initials}</div>
            <span className={styles.statusIndicator} aria-label="Active" />
          </div>
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.dependentName}>{name}</h3>
          <p className={styles.dependentMeta}>
            {typeof dependent.age === "number"
              ? `${dependent.age} years`
              : "Age —"}{" "}
            •{" "}
            {typeof dependent.adherence30 === "number"
              ? `${dependent.adherence30}% adherence (30 days)`
              : "Adherence —"}{" "}
            • {dependent.medications.length} medication
            {dependent.medications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className={styles.cardActions}>
          {isPrinting && (
            <div className={styles.loaderContainer}>
              <Spinner className={styles.spinner} />
            </div>
          )}
          <button
            type="button"
            className={styles.printButton}
            aria-label="Print schedule as PDF"
            onClick={onPrint}
            disabled={isPrinting}
          >
            <PrinterIcon className={styles.actionIcon} />
          </button>
          {/* Future actions for dependents */}
          {/*
          <button type="button" className={styles.editButton}>
            <EditIcon className={styles.editButtonIcon} />
            Edit
          </button>
          <button
            type="button"
            className={styles.expandButton}
            aria-label="Expand"
          >
            <ChevronDownIcon className={styles.expandIcon} />
          </button>
          */}
        </div>
      </div>

      {/* Placeholder for future medications list sourced from real data */}
      <div className={styles.medicationsList}>
        {dependent.medications.map((med) => (
          <div key={med.id} className={styles.medicationItem}>
            <div className={styles.medicationStatus}>
              <CheckCircleIcon
                className={`${styles.checkIcon} ${styles.checkIconPending}`}
              />
            </div>
            <div className={styles.medicationInfo}>
              <span className={styles.medicationName}>{med.name}</span>
              <span className={styles.medicationDetails}>
                {med.dose !== null ? `${med.dose} mg` : "Dose —"}
                {med.form ? ` • ${med.form}` : ""}
              </span>
            </div>
            {/* Future per-medication actions */}
            {/*
            <div className={styles.medicationActions}>
              <button
                type="button"
                className={styles.medActionButton}
                aria-label="Edit medication"
              >
                <PencilIcon className={styles.medActionIcon} />
              </button>
              <button
                type="button"
                className={styles.medActionButton}
                aria-label="Delete medication"
              >
                <TrashIcon className={styles.medActionIcon} />
              </button>
            </div>
            */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DependentsPage() {
  const [data, setData] = useState<CareAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medicationsByUserId, setMedicationsByUserId] = useState<
    Record<string, Medication[]>
  >({});
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [printingUserId, setPrintingUserId] = useState<string | null>(null);
  const [printDialogUserId, setPrintDialogUserId] = useState<string | null>(
    null,
  );
  const [printWeekStart, setPrintWeekStart] = useState<Date | null>(null);
  const [printWeekEnd, setPrintWeekEnd] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCareAccess() {
      try {
        const res = await fetch("/api/care-access", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Please sign in to view your care relationships.");
          }
          throw new Error(
            "Unable to load care relationships. Please try again.",
          );
        }

        const json = (await res.json()) as CareAccessResponse;
        if (!isMounted) return;
        setData(json);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong loading care relationships.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCareAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const caringFor = useMemo(() => data?.caringFor ?? [], [data]);

  // Load medications for each dependent (caringFor user)
  useEffect(() => {
    if (!caringFor.length) {
      setMedicationsByUserId({});
      return;
    }

    let isMounted = true;
    const loadMedications = async () => {
      setMedicationsLoading(true);
      try {
        const uniqueUserIds = Array.from(
          new Set(caringFor.map((access) => access.user.id)),
        );

        const results = await Promise.all(
          uniqueUserIds.map(async (userId) => {
            const res = await fetch(
              `/api/medications?userId=${encodeURIComponent(userId)}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              },
            );

            if (!res.ok) {
              return { userId, medications: [] as Medication[] };
            }

            const json = (await res.json()) as {
              medications: {
                id: string;
                name: string;
                dose: number | null;
                form: string | null;
              }[];
            };

            return { userId, medications: json.medications };
          }),
        );

        if (!isMounted) return;

        const nextMap: Record<string, Medication[]> = {};
        results.forEach(({ userId, medications }) => {
          nextMap[userId] = medications;
        });
        setMedicationsByUserId(nextMap);
      } finally {
        if (isMounted) {
          setMedicationsLoading(false);
        }
      }
    };

    void loadMedications();

    return () => {
      isMounted = false;
    };
  }, [caringFor]);

  const dependentsToRender: Dependent[] = caringFor.map((access) => {
    const meds = medicationsByUserId[access.user.id] ?? [];
    const realAge =
      typeof access.user.age === "number" ? access.user.age : null;
    const realAdherence30 =
      typeof access.user.adherence30Days === "number"
        ? access.user.adherence30Days
        : null;

    return {
      id: access.accessId,
      userId: access.user.id,
      name: access.user.name || "Unknown person",
      age: realAge,
      adherence30: realAdherence30,
      medications: meds,
    };
  });

  const totalDependents = caringFor.length;

  // Precompute weeks for the mini calendar in the print dialog
  const currentWeekDays = printWeekStart ? getWeekDays(printWeekStart) : [];
  let previousWeekDays: Date[] = [];
  let nextWeekDays: Date[] = [];
  if (printWeekStart) {
    const prevStart = new Date(printWeekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    previousWeekDays = getWeekDays(prevStart);

    const nextStart = new Date(printWeekStart);
    nextStart.setDate(nextStart.getDate() + 7);
    nextWeekDays = getWeekDays(nextStart);
  }

  const openPrintDialog = (userId: string) => {
    const days = getWeekDays(new Date());
    const start = days[0];
    const end = days[days.length - 1];
    setPrintWeekStart(start);
    setPrintWeekEnd(end);
    setPrintDialogUserId(userId);
  };

  const shiftWeek = (direction: -1 | 1) => {
    if (!printWeekStart || !printWeekEnd) return;
    const newStart = new Date(printWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    const newEnd = new Date(printWeekEnd);
    newEnd.setDate(newEnd.getDate() + direction * 7);
    setPrintWeekStart(newStart);
    setPrintWeekEnd(newEnd);
  };

  const handlePrint = async (
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ) => {
    if (!userId) return;

    setPrintingUserId(userId);

    try {
      const startDate = new Date(
        Date.UTC(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const endDate = new Date(
        Date.UTC(
          weekEnd.getFullYear(),
          weekEnd.getMonth(),
          weekEnd.getDate(),
          23,
          59,
          59,
          999,
        ),
      );

      const fromISO = startDate.toISOString();
      const toISO = endDate.toISOString();
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          from: fromISO,
          to: toISO,
          tz: timezone,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: "Unknown error",
        }))) as { error?: string };

        console.error("Failed to export PDF:", errorData.error);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "schedule.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      // Keep the loader visible for a brief moment so the user can see it
      setTimeout(() => {
        setPrintingUserId(null);
      }, 400);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <HeartIcon className={styles.heartIcon} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>My Dependents</h1>
            <p className={styles.subtitle}>
              {totalDependents}{" "}
              {totalDependents === 1
                ? "dependent in your care"
                : "dependents in your care"}
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Filter buttons reserved for future use */}
          {/*
          <button type="button" className={styles.filterButton}>
            <TrendingUpIcon className={styles.filterIcon} />
            All
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${styles.filterButtonRisk}`}
          >
            <AlertCircleIcon className={styles.filterIcon} />
            Risk
          </button>
          <Link
            href="/dependents/new"
            className={`${styles.filterButton} ${styles.filterButtonAdd}`}
          >
            <PlusIcon className={styles.filterIcon} />
            Add
          </Link>
          <button type="button" className={styles.analyticsButton}>
            <BarChartIcon className={styles.filterIcon} />
            Analytics
          </button>
          */}
        </div>
      </header>

      <main className={styles.main}>
        {loading && (
          <div className={styles.dependentsList}>
            <p className={styles.subtitle}>Loading your care relationships…</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.dependentsList}>
            <p className={styles.subtitle}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <section aria-label="Dependents list">
            {caringFor.length === 0 ? (
              <p className={styles.subtitle}>You do not have any dependents</p>
            ) : (
              <div className={styles.dependentsList}>
                {dependentsToRender.map((dependent) => (
                  <DependentCard
                    key={dependent.id}
                    dependent={dependent}
                    onPrint={() => openPrintDialog(dependent.userId)}
                    isPrinting={printingUserId === dependent.userId}
                  />
                ))}
                {medicationsLoading && (
                  <p className={styles.subtitle}>
                    Loading medications for your dependents…
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {printDialogUserId && printWeekStart && printWeekEnd && (
          <div className={styles.printDialogOverlay}>
            <div className={styles.printDialog}>
              <div className={styles.printDialogHeader}>
                <h2 className={styles.printDialogTitle}>Print schedule</h2>
                <button
                  type="button"
                  className={styles.printDialogClose}
                  onClick={() => setPrintDialogUserId(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className={styles.printDialogBody}>
                <p className={styles.printDialogDescription}>
                  Choose the week you want to export. The PDF will include all
                  schedule entries for the selected week.
                </p>
                <div className={styles.printDialogWeekPicker}>
                  <button
                    type="button"
                    className={styles.printDialogWeekButton}
                    onClick={() => shiftWeek(-1)}
                  >
                    Previous
                  </button>
                  <div className={styles.printDialogWeekLabel}>
                    {formatWeekRange(printWeekStart, printWeekEnd)}
                  </div>
                  <button
                    type="button"
                    className={styles.printDialogWeekButton}
                    onClick={() => shiftWeek(1)}
                  >
                    Next
                  </button>
                </div>

                <div className={styles.printDialogWeekDays}>
                  <div className={styles.printDialogWeekDaysGrid}>
                    {["M", "T", "W", "T", "F", "S", "S"].map((label, idx) => (
                      <div
                        key={`${label}-${idx}`}
                        className={styles.printDialogWeekdayLabel}
                      >
                        {label}
                      </div>
                    ))}

                    {previousWeekDays.map((day) => {
                      const isToday = (() => {
                        const now = new Date();
                        return (
                          now.getFullYear() === day.getFullYear() &&
                          now.getMonth() === day.getMonth() &&
                          now.getDate() === day.getDate()
                        );
                      })();
                      return (
                        <div
                          key={`prev-${day.toISOString()}`}
                          className={`${styles.printDialogDay} ${
                            isToday ? styles.printDialogDayToday : ""
                          }`}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}

                    {currentWeekDays.map((day) => {
                      const isToday = (() => {
                        const now = new Date();
                        return (
                          now.getFullYear() === day.getFullYear() &&
                          now.getMonth() === day.getMonth() &&
                          now.getDate() === day.getDate()
                        );
                      })();
                      return (
                        <div
                          key={`current-${day.toISOString()}`}
                          className={`${styles.printDialogDay} ${styles.printDialogDayCurrent} ${
                            isToday ? styles.printDialogDayToday : ""
                          }`}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}

                    {nextWeekDays.map((day) => {
                      const isToday = (() => {
                        const now = new Date();
                        return (
                          now.getFullYear() === day.getFullYear() &&
                          now.getMonth() === day.getMonth() &&
                          now.getDate() === day.getDate()
                        );
                      })();
                      return (
                        <div
                          key={`next-${day.toISOString()}`}
                          className={`${styles.printDialogDay} ${
                            isToday ? styles.printDialogDayToday : ""
                          }`}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.printDialogFooter}>
                <button
                  type="button"
                  className={styles.printDialogCancel}
                  onClick={() => setPrintDialogUserId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.printDialogConfirm}
                  onClick={() => {
                    void (async () => {
                      if (
                        !printDialogUserId ||
                        !printWeekStart ||
                        !printWeekEnd
                      )
                        return;
                      await handlePrint(
                        printDialogUserId,
                        printWeekStart,
                        printWeekEnd,
                      );
                      setPrintDialogUserId(null);
                    })();
                  }}
                  disabled={printingUserId !== null}
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/*
      <Link
        href="/dependents/new"
        className={styles.fab}
        aria-label="Add Dependent"
      >
        <UsersIcon className={styles.fabIcon} />
      </Link>
      */}
    </div>
  );
}
