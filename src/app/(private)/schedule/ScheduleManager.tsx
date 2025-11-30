"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { ScheduleTemplateItem } from "@/lib/schedule";
import type { ScheduleCardData } from "./types";
import { mapScheduleTemplateToCard } from "./types";
import styles from "./schedule.module.css";

type ScheduleManagerProps = {
  initialSchedules: ScheduleCardData[];
  searchQuery: string;
  statusFilter: StatusFilter;
  mealFilter: MealFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  onVisibleCountChange?: (count: number) => void;
};

export type StatusFilter = "all" | "active" | "completed";
export type MealFilter = "all" | "before" | "with" | "after" | "anytime";
export type SortField = "name" | "start";
export type SortDirection = "asc" | "desc";

const WEEKDAY_OPTIONS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

function getScheduleStatus(schedule: ScheduleCardData): "active" | "completed" {
  if (!schedule.dateEnd) {
    return "active";
  }
  const end = new Date(`${schedule.dateEnd}T23:59:59Z`);
  return end >= new Date() ? "active" : "completed";
}

function formatFrequency(days: number[]) {
  if (!days.length) return "Custom";
  return WEEKDAY_OPTIONS.filter((option) => days.includes(option.value))
    .map((option) => option.label)
    .join(", ");
}

function formatDose(schedule: ScheduleCardData) {
  const dose = schedule.medication?.dose
    ? `${schedule.medication.dose}mg`
    : null;
  return [dose, `${schedule.quantity} ${schedule.units}`]
    .filter(Boolean)
    .join(" • ");
}

function getFrequencyLabel(schedule: ScheduleCardData): string {
  if (schedule.timeOfDay.length === 1 && schedule.frequencyDays.length >= 5) {
    return "Once daily";
  }
  if (schedule.timeOfDay.length > 1 && schedule.frequencyDays.length >= 5) {
    return `${schedule.timeOfDay.length} doses daily`;
  }
  if (schedule.frequencyDays.length) {
    return formatFrequency(schedule.frequencyDays);
  }
  return "Custom";
}

export function ScheduleManager({
  initialSchedules,
  searchQuery,
  statusFilter,
  mealFilter,
  sortField,
  sortDirection,
  onVisibleCountChange,
}: ScheduleManagerProps) {
  const router = useRouter();
  const [schedules, setSchedules] =
    useState<ScheduleCardData[]>(initialSchedules);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduleCardData | null>(null);

  const filteredSchedules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = schedules.filter((schedule) => {
      const status = getScheduleStatus(schedule);
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }
      if (mealFilter !== "all" && schedule.mealTiming !== mealFilter) {
        return false;
      }
      if (query) {
        const haystack =
          `${schedule.medication?.name ?? ""} ${schedule.units}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortField === "name") {
        const nameA = (a.medication?.name ?? "").toLowerCase();
        const nameB = (b.medication?.name ?? "").toLowerCase();
        return nameA.localeCompare(nameB);
      }
      const dateA = new Date(a.dateStart).getTime();
      const dateB = new Date(b.dateStart).getTime();
      return dateA - dateB;
    });

    if (sortDirection === "desc") {
      sorted.reverse();
    }

    return sorted;
  }, [
    schedules,
    searchQuery,
    statusFilter,
    mealFilter,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    onVisibleCountChange?.(filteredSchedules.length);
  }, [filteredSchedules.length, onVisibleCountChange]);

  return (
    <section className="space-y-6">
      {filteredSchedules.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>
            No schedules match your filters
          </p>
          <p className={styles.emptyStateText}>
            Adjust the filters or create a new schedule to get started.
          </p>
        </div>
      ) : (
        <div className={styles.scheduleCompactGrid}>
          {filteredSchedules.map((schedule) => {
            const status = getScheduleStatus(schedule);
            const doseLabel = formatDose(schedule);
            const frequencyLabel = getFrequencyLabel(schedule);
            const sortedTimes = [...schedule.timeOfDay].sort((a, b) =>
              a.localeCompare(b),
            );
            return (
              <article key={schedule.id} className={styles.scheduleCompactCard}>
                <div className={styles.compactHeader}>
                  <div className={styles.compactHeaderLeft}>
                    <div className={styles.compactIcon}>
                      <PillIcon className={styles.compactIconGlyph} />
                    </div>
                    <div>
                      <p className={styles.compactTitle}>
                        {schedule.medication?.name ?? "Medication removed"}
                      </p>
                      {doseLabel ? (
                        <p className={styles.compactDose}>{doseLabel}</p>
                      ) : null}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      styles.badge,
                      status === "active"
                        ? styles.badgePositive
                        : styles.badgeNeutral,
                    )}
                  >
                    {status === "active" ? "Active" : "Completed"}
                  </span>
                </div>

                <div className={styles.compactTimeRow}>
                  <ClockIcon className={styles.compactTimeIcon} />
                  <div className={styles.compactTimeList}>
                    {sortedTimes.length ? (
                      sortedTimes.map((time) => (
                        <span
                          key={`${schedule.id}-${time}`}
                          className={styles.compactTimeChip}
                        >
                          {time}
                        </span>
                      ))
                    ) : (
                      <span className={styles.compactTimeChip}>--:--</span>
                    )}
                  </div>
                </div>

                <div className={styles.compactBadges}>
                  <span className={clsx(styles.badge, styles.badgeOutline)}>
                    {frequencyLabel}
                  </span>
                </div>

                <div className={styles.compactDivider} />

                <div className={styles.compactFooter}>
                  <button
                    type="button"
                    onClick={() => router.push("/week")}
                    className={clsx(
                      styles.heroButton,
                      styles.heroSecondary,
                      styles.compactCalendarButton,
                    )}
                  >
                    <CalendarIcon className={styles.heroButtonIcon} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSchedule(schedule)}
                    className={clsx(
                      styles.heroButton,
                      styles.heroSecondary,
                      styles.compactEditButton,
                    )}
                  >
                    <span>Edit</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editingSchedule ? (
        <ScheduleEditDialog
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSave={(updated) => {
            setSchedules((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item)),
            );
            setEditingSchedule(null);
          }}
          onDelete={(deletedId) => {
            setSchedules((prev) =>
              prev.filter((item) => item.id !== deletedId),
            );
          }}
        />
      ) : null}
    </section>
  );
}

type ScheduleEditDialogProps = {
  schedule: ScheduleCardData;
  onClose: () => void;
  onSave: (schedule: ScheduleCardData) => void;
  onDelete?: (scheduleId: string) => void;
};

function ScheduleEditDialog({
  schedule,
  onClose,
  onSave,
  onDelete,
}: ScheduleEditDialogProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(schedule.quantity));
  const [units, setUnits] = useState(schedule.units);
  const [mealTiming, setMealTiming] = useState(schedule.mealTiming);
  const [durationDays, setDurationDays] = useState(
    String(schedule.durationDays),
  );
  const [dateStart, setDateStart] = useState(schedule.dateStart);
  const [daySelection, setDaySelection] = useState<Set<number>>(
    new Set(schedule.frequencyDays),
  );
  const [timeFields, setTimeFields] = useState<string[]>(
    schedule.timeOfDay.length ? schedule.timeOfDay : ["08:00"],
  );
  const [regenerateEntries, setRegenerateEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleDay = (value: number) => {
    setDaySelection((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const handleTimeChange = (index: number, value: string) => {
    setTimeFields((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddTime = () => {
    setTimeFields((prev) => [...prev, ""]);
  };

  const handleRemoveTime = (index: number) => {
    setTimeFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const selectedDays = Array.from(daySelection).sort((a, b) => a - b);
    const sanitizedTimes = timeFields
      .map((time) => time.trim())
      .filter((time) => Boolean(time));

    if (!selectedDays.length) {
      setError("Select at least one weekday.");
      return;
    }

    if (!sanitizedTimes.length) {
      setError("Add at least one time of day.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quantity: Number(quantity),
        units: units.trim(),
        mealTiming,
        durationDays: Number(durationDays),
        dateStart,
        frequencyDays: selectedDays,
        timeOfDay: sanitizedTimes,
        regenerateEntries,
      };

      const res = await fetch(`/api/schedule/templates/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to update schedule");
      }

      const data = (await res.json()) as { schedule: ScheduleTemplateItem };
      const normalized = mapScheduleTemplateToCard(data.schedule);
      onSave(normalized);
      startTransition(() => router.refresh());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/schedule/templates/${schedule.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to delete schedule");
      }

      onDelete?.(schedule.id);
      onClose();
      startTransition(() => router.refresh());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete schedule. Please try again.");
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialogPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <div>
            <p className={styles.dialogTitleLabel}>Edit schedule</p>
            <h3 className={styles.dialogTitle}>
              {schedule.medication?.name ?? "Medication removed"}
            </h3>
            <p className={styles.dialogTitleMeta}>
              {schedule.medication?.dose
                ? `${schedule.medication.dose} mg`
                : "No dosage"}
              {schedule.medication?.form
                ? ` • ${schedule.medication.form}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={styles.dialogCloseButton}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.dialogBody}>
            <div className={styles.formGrid}>
              <label className={styles.formLabel}>
                Quantity
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formLabel}>
                Units
                <input
                  type="text"
                  value={units}
                  onChange={(event) => setUnits(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formLabel}>
                Start Date
                <input
                  type="date"
                  value={dateStart}
                  onChange={(event) => setDateStart(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.formLabel}>
                Duration (days)
                <input
                  type="number"
                  min={0}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  className={styles.input}
                />
              </label>
            </div>

            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>
                Weekdays
                <span className={styles.formSectionHint}>Tap to toggle</span>
              </p>
              <div className={styles.weekdayGrid}>
                {WEEKDAY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDay(option.value)}
                    className={clsx(
                      styles.weekdayButton,
                      daySelection.has(option.value) &&
                        styles.weekdayButtonActive,
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formSection}>
              <p className={styles.formSectionTitle}>Times of day</p>
              <div className={styles.timeList}>
                {[...timeFields]
                  .map((time, index) => ({ time, index }))
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(({ time, index }) => (
                    <div key={`time-${index}`} className={styles.timeRow}>
                      <input
                        type="time"
                        value={time}
                        onChange={(event) =>
                          handleTimeChange(index, event.target.value)
                        }
                        className={styles.input}
                      />
                      {timeFields.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(index)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
              </div>
              <button
                type="button"
                onClick={handleAddTime}
                className={styles.addTimeButton}
              >
                + Add another time
              </button>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>
                Meal timing
                <select
                  value={mealTiming}
                  onChange={(event) =>
                    setMealTiming(
                      event.target.value as ScheduleCardData["mealTiming"],
                    )
                  }
                  className={styles.input}
                >
                  <option value="before">Before meal</option>
                  <option value="with">With meal</option>
                  <option value="after">After meal</option>
                  <option value="anytime">Anytime</option>
                </select>
              </label>
            </div>

            <div className={styles.checkboxRow}>
              <input
                id="regenerate"
                type="checkbox"
                className={styles.checkboxInput}
                checked={regenerateEntries}
                onChange={(event) => setRegenerateEntries(event.target.checked)}
              />
              <label htmlFor="regenerate" className={styles.formLabel}>
                Regenerate future schedule entries after saving
              </label>
            </div>

            {error ? (
              <p className={styles.errorMessage} role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className={styles.dialogFooter}>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={submitting || deleting || isPending}
              className={styles.dialogDeleteButton}
            >
              Delete
            </button>
            <div className={styles.dialogFooterRight}>
              <button
                type="button"
                onClick={onClose}
                className={styles.dialogCancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || deleting || isPending}
                className={styles.dialogSaveButton}
              >
                {submitting || isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <span className={styles.saveButtonTextFull}>
                      Save changes
                    </span>
                    <span className={styles.saveButtonTextMobile}>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmPanel}>
              <h4 className={styles.confirmTitle}>Delete Schedule?</h4>
              <p className={styles.confirmText}>
                This will delete the schedule and remove all future doses. Past
                entries will be preserved for your history.
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.dialogCancelButton}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={styles.confirmDeleteButton}
                >
                  {deleting ? "Deleting..." : "Delete Schedule"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type IconProps = {
  className?: string;
};

function PillIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"
        stroke="#2196f3"
      />
      <path d="m8.5 8.5 7 7" stroke="#2196f3" />
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

/*function DotsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}*/

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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
