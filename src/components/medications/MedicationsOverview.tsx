"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AddMedicationButton from "@/components/medications/AddMedicationButton";
import DeleteMedicationButton from "@/components/medications/DeleteMedicationButton";
import { getMedicationFormLabel } from "@/lib/medicationTypes";
import { cn } from "@/lib/utils";
import type { MedicationListItem } from "@/lib/medicationsListTypes";

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
  const hasQueryOrFilters = search.trim().length > 0 || activeFilterCount > 0;
  const resultCount = filteredMedications.length;

  const handleClearAll = () => {
    setSearch("");
    setFilters({ hasDoseOnly: false });
  };

  const handleToggleDoseFilter = () => {
    setFilters((prev) => ({ ...prev, hasDoseOnly: !prev.hasDoseOnly }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              All Medications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {initial.length}{" "}
              {initial.length === 1 ? "medication" : "medications"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu medications={filteredMedications} />
            <AddMedicationButton />
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm lg:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search medications by name, dosage, or form..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <FiltersButton
              activeCount={activeFilterCount}
              hasFilters={filters.hasDoseOnly}
              onToggleDose={handleToggleDoseFilter}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div>
              {hasAnyMedications ? (
                hasQueryOrFilters ? (
                  <span>
                    {resultCount} results found
                    {search.trim() && (
                      <>
                        {" "}
                        for{" "}
                        <span className="font-medium">
                          &quot;{search.trim()}&quot;
                        </span>
                      </>
                    )}
                  </span>
                ) : (
                  <span>{resultCount} results found</span>
                )
              ) : (
                <span>No medications yet</span>
              )}
            </div>
            {hasQueryOrFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear all
              </button>
            )}
          </div>

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
    </div>
  );
}

type FiltersButtonProps = {
  activeCount: number;
  hasFilters: boolean;
  onToggleDose: () => void;
};

function FiltersButton({
  activeCount,
  hasFilters,
  onToggleDose,
}: FiltersButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="md"
        className={cn(
          "flex items-center gap-2 border-gray-300 text-sm text-gray-700",
          hasFilters && "border-indigo-500 bg-indigo-50 text-indigo-700",
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <FilterIcon className="h-4 w-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-semibold text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-black/5">
          <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Filters
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={hasFilters}
              onChange={onToggleDose}
            />
            <span>Only medications with dosage</span>
          </label>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type MedicationsGridProps = {
  items: MedicationListItem[];
};

function MedicationsGrid({ items }: MedicationsGridProps) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      ? `${medication.dose} mg`
      : "No dose specified";
  const formLabel = getMedicationFormLabel(
    (medication.form as never) || undefined,
  );

  return (
    <article className="flex h-52 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Іконка як у дизайні: квадрат з м’якими кутами + синя outline-пігулка */}
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#2196F3]">
          <PillIcon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            {medication.name}
          </h2>
          <p className="mt-0.5 text-sm text-indigo-600">{doseText}</p>
          {formLabel && (
            <p className="mt-1 text-xs text-gray-500">{formLabel}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
          Active
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Link
            href={`/medications/${medication.id}/edit`}
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Edit
          </Link>
          <DeleteMedicationButton id={medication.id} />
        </div>
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
    <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-gray-600">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#2196F3] shadow-sm">
        <PillIcon className="h-9 w-9" />
      </div>
      <h2 className="text-base font-semibold text-gray-900">
        {hasAnyMedications ? "No medications found" : "No medications yet"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {hasAnyMedications
          ? "Try adjusting your search or filters."
          : "Add a medication to get started."}
      </p>
      {hasAnyMedications && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="border-gray-300"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

type ExportMenuProps = {
  medications: MedicationListItem[];
};

function ExportMenu({ medications }: ExportMenuProps) {
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
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="md"
        className="flex items-center gap-2 border-gray-300 text-sm text-gray-700"
        onClick={() => setOpen((prev) => !prev)}
      >
        <DownloadIcon className="h-4 w-4" />
        <span>Export</span>
      </Button>

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
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
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
}

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
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

function DownloadIcon({ className }: IconProps) {
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
      <path d="M4 20h16" />
      <path d="M12 4v11" />
      <path d="m6 11 6 6 6-6" />
    </svg>
  );
}

function SheetIcon({ className }: IconProps) {
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
}

function BracesIcon({ className }: IconProps) {
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
}

function PrinterIcon({ className }: IconProps) {
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
}
