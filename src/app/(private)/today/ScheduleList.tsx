"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import styles from "./today.module.css";
import {
  formatDose,
  formatDosage,
  extractTimeFromLocalDateTime,
  mapMealTimingToContext,
  updateScheduleEntryStatus,
} from "@/lib/schedule-utils";
import type { ScheduleEntryItem } from "@/lib/schedule";

type ScheduleContext = "before" | "with" | "anytime" | "after" | "taken";

type ScheduleItem = {
  id: string;
  name: string;
  dosage: string;
  dose: string;
  time: string;
  context: ScheduleContext;
  status: "PLANNED" | "DONE";
  medication: {
    id: string;
    name: string;
    dose: number;
  } | null;
};

const contextLabels: Record<ScheduleContext, string> = {
  before: "before meal",
  with: "with meal",
  after: "after meal",
  anytime: "anytime",
  taken: "taken",
};

const contextClassMap: Record<ScheduleContext, string> = {
  before: styles.contextBefore,
  with: styles.contextWith,
  after: styles.contextAfter,
  anytime: styles.contextAnytime,
  taken: styles.contextTaken,
};

type ScheduleListProps = {
  initialEntries: ScheduleEntryItem[];
  selectedDate: Date;
  today: Date;
};

function formatScheduleTitle(selectedDate: Date, today: Date): string {
  const isToday =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear();

  if (isToday) {
    return "Today's Schedule";
  }

  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(selectedDate);

  return `${dateStr} Schedule`;
}

export function ScheduleList({
  initialEntries,
  selectedDate,
  today,
}: ScheduleListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Transform API response to ScheduleItem format
  const transformEntry = (entry: ScheduleEntryItem): ScheduleItem => ({
    id: entry.id,
    name: entry.medication?.name || "",
    dosage: entry.medication ? formatDosage(entry.medication.dose) : "",
    dose: formatDose(entry.quantity, entry.units),
    time: extractTimeFromLocalDateTime(entry.localDateTime),
    context: mapMealTimingToContext(entry.mealTiming, entry.status),
    status: entry.status,
    medication: entry.medication,
  });

  const allItems = initialEntries
    .filter((entry) => entry.medication)
    .map(transformEntry)
    .sort((a, b) => a.time.localeCompare(b.time));

  const activeSchedule = allItems.filter((item) => item.status === "PLANNED");
  const completedSchedule = allItems.filter((item) => item.status === "DONE");

  const handleStatusToggle = async (item: ScheduleItem) => {
    const newStatus = item.status === "PLANNED" ? "DONE" : "PLANNED";

    // Optimistic update
    setUpdatingIds((prev) => new Set(prev).add(item.id));

    try {
      await updateScheduleEntryStatus(item.id, newStatus);

      // Refresh the page data
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to update schedule entry:", error);
      // On error, refresh to restore correct state
      router.refresh();
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleMarkAll = async () => {
    if (activeSchedule.length === 0) {
      return;
    }

    // Add all active items to updatingIds for optimistic UI
    const allActiveIds = activeSchedule.map((item) => item.id);
    setUpdatingIds((prev) => new Set([...prev, ...allActiveIds]));

    try {
      // Update all active entries to DONE in parallel
      await Promise.all(
        activeSchedule.map((item) =>
          updateScheduleEntryStatus(item.id, "DONE"),
        ),
      );

      // Refresh the page data after all updates complete
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to mark all as taken:", error);
      // On error, refresh to restore correct state
      router.refresh();
    } finally {
      // Clear all IDs from updatingIds
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        allActiveIds.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/schedule/${entryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Failed to delete schedule entry:", error);
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
      setOpenMenuId(null);
    }
  };

  const handleMenuToggle = (itemId: string) => {
    setOpenMenuId((prev) => (prev === itemId ? null : itemId));
  };

  const handleDeleteClick = (itemId: string) => {
    setOpenMenuId(null);
    setDeleteConfirmId(itemId);
  };

  const pendingCount = activeSchedule.length;
  const completedCount = completedSchedule.length;

  return (
    <section className={styles.scheduleSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>
            {formatScheduleTitle(selectedDate, today)}
          </h2>
          <p className={styles.sectionSubtitle}>
            {pendingCount === 0
              ? "All caught up"
              : pendingCount === 1
                ? "1 medication pending"
                : `${pendingCount} medications pending`}{" "}
            · {completedCount} completed
          </p>
        </div>
        <button
          type="button"
          className={styles.markAllButton}
          onClick={handleMarkAll}
          disabled={isPending || pendingCount === 0}
        >
          <CheckIcon className={styles.markAllIcon} />
          <span>Mark All</span>
        </button>
      </div>

      <ul className={styles.scheduleList}>
        {activeSchedule.map((item) => {
          const isUpdating = updatingIds.has(item.id);
          const isMenuOpen = openMenuId === item.id;
          return (
            <li key={item.id} className={styles.listItem}>
              <button
                type="button"
                className={styles.statusButton}
                aria-label={`Mark ${item.name} as taken`}
                onClick={() => handleStatusToggle(item)}
                disabled={isUpdating || isPending}
              ></button>
              <div className={styles.itemContent}>
                <div className={styles.itemTitleRow}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  {item.dosage && (
                    <span className={styles.dosage}>{item.dosage}</span>
                  )}
                </div>
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
              <EntryMenu
                isOpen={isMenuOpen}
                onToggle={() => handleMenuToggle(item.id)}
                onDelete={() => handleDeleteClick(item.id)}
              />
            </li>
          );
        })}
      </ul>

      <div className={styles.sectionDivider}>
        <span>Done</span>
        <div className={styles.dividerLine} aria-hidden />
      </div>

      <ul className={clsx(styles.scheduleList, styles.completedList)}>
        {completedSchedule.map((item) => {
          const isUpdating = updatingIds.has(item.id);
          const isMenuOpen = openMenuId === item.id;
          return (
            <li key={item.id} className={styles.listItem}>
              <button
                type="button"
                className={clsx(
                  styles.statusButton,
                  styles.statusButtonCompleted,
                )}
                aria-label={`Mark ${item.name} as not taken`}
                onClick={() => handleStatusToggle(item)}
                disabled={isUpdating || isPending}
              >
                <CheckIcon className={styles.statusIcon} />
              </button>
              <div className={styles.itemContent}>
                <div className={styles.itemTitleRow}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  {item.dosage && (
                    <span className={styles.dosage}>{item.dosage}</span>
                  )}
                </div>
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
              <EntryMenu
                isOpen={isMenuOpen}
                onToggle={() => handleMenuToggle(item.id)}
                onDelete={() => handleDeleteClick(item.id)}
              />
            </li>
          );
        })}
      </ul>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          onConfirm={() => handleDeleteEntry(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
          deleting={deleting}
        />
      )}
    </section>
  );
}

type IconProps = {
  className?: string;
};

// Icon components (inline SVG icons)
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
      <path d="m5 12 5 5 9-9" />
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
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon({ className }: IconProps) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

// Entry Menu Component
type EntryMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

function EntryMenu({ isOpen, onToggle, onDelete }: EntryMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className={styles.menuWrapper} ref={menuRef}>
      <button
        type="button"
        className={clsx(styles.moreButton, isOpen && styles.moreButtonActive)}
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <MoreIcon className={styles.moreIcon} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="menu">
          <button
            type="button"
            className={styles.menuItemDanger}
            role="menuitem"
            onClick={onDelete}
          >
            <TrashIcon className={styles.menuItemIcon} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Delete Confirmation Dialog
type DeleteConfirmDialogProps = {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
};

function DeleteConfirmDialog({
  onConfirm,
  onCancel,
  deleting,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, deleting]);

  // Focus trap and initial focus
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <div
      className={styles.dialogOverlay}
      onClick={deleting ? undefined : onCancel}
    >
      <div
        className={styles.confirmDialog}
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.confirmDialogIcon}>
          <TrashIcon className={styles.confirmDialogIconSvg} />
        </div>
        <h3 id="delete-dialog-title" className={styles.confirmDialogTitle}>
          Delete entry?
        </h3>
        <p id="delete-dialog-desc" className={styles.confirmDialogDesc}>
          This schedule entry will be permanently removed. This action cannot be
          undone.
        </p>
        <div className={styles.confirmDialogActions}>
          <button
            type="button"
            className={styles.confirmDialogCancel}
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmDialogDelete}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
