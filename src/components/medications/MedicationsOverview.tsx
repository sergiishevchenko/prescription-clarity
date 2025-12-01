"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";

import DeleteMedicationButton from "@/components/medications/DeleteMedicationButton";
import { getMedicationFormLabel } from "@/lib/medicationTypes";
import type { MedicationListItem } from "@/lib/medicationsListTypes";
import styles from "./medications.module.css";

type MedicationsOverviewProps = {
  initial: MedicationListItem[];
};

type FilterState = {
  hasDoseOnly: boolean;
};

export default function MedicationsOverview({
  initial,
}: MedicationsOverviewProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>({ hasDoseOnly: false });

  const activeFilterCount = useMemo(
    () => (filters.hasDoseOnly ? 1 : 0),
    [filters.hasDoseOnly],
  );

  const filteredMedications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initial.filter((item) => {
      if (
        filters.hasDoseOnly &&
        (item.dose == null || Number.isNaN(item.dose))
      ) {
        return false;
      }

      if (!q) return true;

      const doseText =
        item.dose != null && !Number.isNaN(item.dose) ? `${item.dose}` : "";
      const formLabel = getMedicationFormLabel(
        (item.form as never) || undefined,
      );

      const haystack = [item.name, doseText, formLabel, item.form ?? ""]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [filters.hasDoseOnly, initial, search]);

  const hasAnyMedications = initial.length > 0;
  //const hasQueryOrFilters = search.trim().length > 0 || activeFilterCount > 0;
  const resultCount = filteredMedications.length;

  const handleClearAll = () => {
    setSearch("");
    setFilters({ hasDoseOnly: false });
  };

  const handleToggleDoseFilter = () => {
    setFilters((prev) => ({ ...prev, hasDoseOnly: !prev.hasDoseOnly }));
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updatePlaceholder = () => {
      if (searchInputRef.current) {
        if (window.innerWidth <= 768) {
          searchInputRef.current.placeholder = "Search medications...";
        } else {
          searchInputRef.current.placeholder =
            "Search medications by name, dosage, or form...";
        }
      }
    };

    updatePlaceholder();
    window.addEventListener("resize", updatePlaceholder);
    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  return (
    <>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <div className={styles.heroTopLeft}>
              <div className={styles.heroTopRow}>
                <h1>Medications</h1>
                <div className={styles.heroActions}>
                  {/* <ExportMenu medications={filteredMedications} /> */}
                  <Link
                    href="/medications/new"
                    className={clsx(styles.heroButton, styles.heroPrimary)}
                  >
                    <PlusIcon
                      className={styles.heroButtonIcon}
                      aria-hidden="true"
                    />
                    <span className={styles.heroButtonTextFull}>
                      Add Medication
                    </span>
                    <span className={styles.heroButtonTextMobile}>Add</span>
                  </Link>
                </div>
              </div>
              <p>
                View and manage all your medications. Add new ones or edit
                existing entries.
              </p>
            </div>
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchInputWrapper}>
              <div className={styles.searchInputContainer}>
                <span className={styles.searchIcon}>
                  <SearchIcon
                    className={styles.searchIconIcon}
                    aria-hidden="true"
                  />
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medications by name, dosage, or form..."
                  className={styles.searchInput}
                />
              </div>
              <p className={styles.searchMeta}>
                {resultCount} of {initial.length} medications visible
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={clsx(
                styles.heroButton,
                styles.heroSecondary,
                styles.filtersToggleButton,
                activeFilterCount > 0 && styles.filtersToggleActive,
                filtersOpen && !activeFilterCount && styles.filtersToggleOpen,
              )}
            >
              <FilterIcon
                className={styles.heroButtonIcon}
                aria-hidden="true"
              />
              <span className={styles.filtersButtonTextFull}>
                {filtersOpen ? "Hide filters" : "Filters"}
              </span>
            </button>
          </div>
          {filtersOpen && (
            <div className={styles.filtersPanel}>
              <FiltersPanel
                hasFilters={filters.hasDoseOnly}
                onToggleDose={handleToggleDoseFilter}
                onClear={handleClearAll}
                onClose={() => setFiltersOpen(false)}
              />
            </div>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.sectionStack}>
          {resultCount === 0 ? (
            <NoResultsState
              hasAnyMedications={hasAnyMedications}
              onClearFilters={handleClearAll}
            />
          ) : (
            <MedicationsGrid items={filteredMedications} />
          )}
        </div>
      </div>
    </>
  );
}

type FiltersPanelProps = {
  hasFilters: boolean;
  onToggleDose: () => void;
  onClear: () => void;
  onClose: () => void;
};

function FiltersPanel({
  hasFilters,
  onToggleDose,
  onClear,
}: FiltersPanelProps) {
  return (
    <div className={styles.filtersPanelInner}>
      <div className={styles.filtersHeader}>
        <div className={styles.filtersHeaderRow}>
          <p className={styles.filtersTitle}>Filters</p>
          <button
            type="button"
            className={styles.filtersResetButton}
            onClick={onClear}
          >
            Reset
          </button>
        </div>
        <p className={styles.filtersSubtitle}>
          Filter medications by specific criteria.
        </p>
      </div>
      <label className={styles.filtersPanelLabel}>
        <input
          type="checkbox"
          className={styles.filtersPanelCheckbox}
          checked={hasFilters}
          onChange={onToggleDose}
        />
        <span>Only medications with dosage</span>
      </label>
    </div>
  );
}

type MedicationsGridProps = {
  items: MedicationListItem[];
};

function MedicationsGrid({ items }: MedicationsGridProps) {
  return (
    <div className={styles.medicationsGrid}>
      {items.map((medication) => (
        <MedicationCard key={medication.id} medication={medication} />
      ))}
    </div>
  );
}

type MedicationCardProps = {
  medication: MedicationListItem;
};

function MedicationCard({ medication }: MedicationCardProps) {
  const doseText =
    medication.dose != null && !Number.isNaN(medication.dose)
      ? `${medication.dose}mg`
      : "No dose specified";
  const formLabel = getMedicationFormLabel(
    (medication.form as never) || undefined,
  );

  return (
    <article className={styles.medicationCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <div className={styles.cardIcon}>
            <PillIcon className={styles.cardIconGlyph} />
          </div>
          <div>
            <h2 className={styles.cardTitle}>{medication.name}</h2>
            <p className={styles.cardDose}>{doseText}</p>
            {formLabel && <p className={styles.cardForm}>{formLabel}</p>}
          </div>
        </div>
        <span className={clsx(styles.badge, styles.badgePositive)}>Active</span>
      </div>

      <div className={styles.cardDivider} />

      <div className={styles.cardFooter}>
        <div className={styles.cardDeleteButton}>
          <DeleteMedicationButton id={medication.id} />
        </div>
        <Link
          href={`/medications/${medication.id}/edit`}
          className={clsx(
            styles.heroButton,
            styles.heroSecondary,
            styles.cardEditButton,
          )}
        >
          <span>Edit</span>
        </Link>
      </div>
    </article>
  );
}

type NoResultsStateProps = {
  hasAnyMedications: boolean;
  onClearFilters: () => void;
};

function NoResultsState({
  hasAnyMedications,
  onClearFilters,
}: NoResultsStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <PillIcon className={styles.emptyStateIconGlyph} />
      </div>
      <h2 className={styles.emptyStateTitle}>
        {hasAnyMedications ? "No medications found" : "No medications yet"}
      </h2>
      <p className={styles.emptyStateText}>
        {hasAnyMedications
          ? "Try adjusting your search or filters."
          : "Add a medication to get started."}
      </p>
      {hasAnyMedications && (
        <div className={styles.emptyStateButton}>
          <button
            type="button"
            onClick={onClearFilters}
            className={clsx(styles.heroButton, styles.heroSecondary)}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

/*type ExportMenuProps = {
  medications: MedicationListItem[];
};*/

/*function ExportMenu({ medications }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  const handleExportCsv = () => {
    if (!medications.length) return;
    const header = ["Name", "Dose", "Form", "Created At", "Updated At"];
    const rows = medications.map((m) => [
      m.name,
      m.dose != null && !Number.isNaN(m.dose) ? String(m.dose) : "",
      m.form ?? "",
      m.createdAt,
      m.updatedAt,
    ]);

    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((value) => {
            const safe = value ?? "";
            if (/[",\n]/.test(safe)) {
              return `"${safe.replace(/"/g, '""')}"`;
            }
            return safe;
          })
          .join(","),
      )
      .join("\r\n");

    downloadTextFile("medications.csv", csv, "text/csv;charset=utf-8;");
    setOpen(false);
  };

  const handleExportJson = () => {
    if (!medications.length) return;
    const json = JSON.stringify(medications, null, 2);
    downloadTextFile(
      "medications.json",
      json,
      "application/json;charset=utf-8;",
    );
    setOpen(false);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className={clsx(styles.heroButton, styles.heroSecondary)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <DownloadIcon className={styles.heroButtonIcon} />
        <span>Export</span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg bg-white py-2 text-sm shadow-lg ring-1 ring-black/5">
          <div className="px-4 pb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Export Medications
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-gray-50"
          >
            <span className="mt-0.5 text-green-600">
              <SheetIcon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Export to CSV
              </span>
              <span className="block text-xs text-gray-500">
                Excel-compatible spreadsheet
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-gray-50"
          >
            <span className="mt-0.5 text-blue-600">
              <BracesIcon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Export to JSON
              </span>
              <span className="block text-xs text-gray-500">
                Machine-readable format
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex w-full items-start gap-3 px-4 py-2 text-left hover:bg-gray-50"
          >
            <span className="mt-0.5 text-purple-600">
              <PrinterIcon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Print List
              </span>
              <span className="block text-xs text-gray-500">
                Print-friendly format
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}*/

/*function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}*/

type IconProps = {
  className?: string;
};

/** Та сама пігулка, що на 3-му скріні (lucide-pill) */
function PillIcon({ className }: IconProps) {
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
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m10.5 20.5 10-10a4.95 4.95 0 0 0-7-7L3.5 13.5a4.95 4.95 0 0 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function FilterIcon({ className }: IconProps) {
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

function PlusIcon({ className }: IconProps) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/*function DownloadIcon({ className }: IconProps) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}*/

/*function SheetIcon({ className }: IconProps) {
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
      <path d="M4 4h10l6 6v10H4z" />
      <path d="M14 4v6h6" />
      <path d="M8 14h8" />
      <path d="M8 18h5" />
    </svg>
  );
}*/

/*function BracesIcon({ className }: IconProps) {
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
      <path d="M7 4c-1.1 0-2 .9-2 2v3c0 1.1-.9 2-2 2 1.1 0 2 .9 2 2v3c0 1.1.9 2 2 2" />
      <path d="M17 4c1.1 0 2 .9 2 2v3c0 1.1.9 2 2 2-1.1 0-2 .9-2 2v3c0 1.1-.9 2-2 2" />
    </svg>
  );
}*/

/*function PrinterIcon({ className }: IconProps) {
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
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}*/
