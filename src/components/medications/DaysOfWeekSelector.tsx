"use client";

import { DAY_LABELS } from "@/lib/medicationTypes";
import styles from "./DaysOfWeekSelector.module.css";

type Props = {
  selected: string[];
  onToggle: (label: string) => void;
  onApplyPreset: (labels: readonly string[]) => void;
};

const PRESETS = [
  { id: "all", label: "All Days", labels: DAY_LABELS },
  { id: "weekdays", label: "Weekdays", labels: DAY_LABELS.slice(0, 5) },
  { id: "weekends", label: "Weekends", labels: DAY_LABELS.slice(5) },
] as const;

export default function DaysOfWeekSelector({
  selected,
  onToggle,
  onApplyPreset,
}: Props) {
  const selectedSet = new Set(selected);
  const orderedSelection = DAY_LABELS.filter((label) => selectedSet.has(label));

  const isPresetActive = (labels: readonly string[]) =>
    labels.length === orderedSelection.length &&
    labels.every((label) => selectedSet.has(label));

  return (
    <div className={styles.wrapper}>
      <p className={styles.helper}>Which days do you take this medication?</p>

      <div className={styles.quickOptions}>
        {PRESETS.map(({ id, label, labels }) => {
          const active = isPresetActive(labels);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onApplyPreset(labels)}
              className={`${styles.quickButton} ${active ? styles.quickButtonActive : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className={styles.dayGrid}>
        {DAY_LABELS.map((d) => {
          const active = selectedSet.has(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onToggle(d)}
              className={`${styles.dayButton} ${active ? styles.dayButtonActive : ""}`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className={styles.selectedPanel}>
        <p className={styles.selectedTitle}>Selected Days:</p>
        <div className={styles.selectedChips}>
          {orderedSelection.length > 0 ? (
            orderedSelection.map((label) => (
              <span key={label} className={styles.selectedChip}>
                {label}
              </span>
            ))
          ) : (
            <span className={styles.emptySelection}>No days selected yet</span>
          )}
        </div>
      </div>
    </div>
  );
}
