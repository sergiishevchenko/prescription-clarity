"use client";

import { useState } from "react";
import styles from "./week.module.css";

type FilterToggleButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
};

function FilterIcon({ className }: { className?: string }) {
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
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function FilterToggleButton({
  isOpen,
  onToggle,
}: FilterToggleButtonProps) {
  return (
    <button
      type="button"
      className={styles.filterToggleButton}
      aria-label={isOpen ? "Hide filters" : "Show filters"}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <FilterIcon className={styles.filterToggleIcon} />
    </button>
  );
}

