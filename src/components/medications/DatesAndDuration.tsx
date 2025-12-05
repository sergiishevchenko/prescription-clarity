"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/ui/Input";
import type { FormValues } from "@/lib/medicationTypes";
import styles from "./DatesAndDuration.module.css";

function CalendarIcon({ className }: { className?: string }) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="8" y="14" width="3" height="3" rx="0.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const DURATION_UNITS = [
  { value: "days", label: "Days", multiplier: 1 },
  { value: "weeks", label: "Weeks", multiplier: 7 },
  { value: "months", label: "Months", multiplier: 30 },
] as const;

type DurationUnit = (typeof DURATION_UNITS)[number]["value"];

const DURATION_PRESETS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "3 months", value: 90 },
  { label: "6 months", value: 180 },
] as const;

const unitToDays = (value: number, unit: DurationUnit) => {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const multiplier =
    DURATION_UNITS.find((option) => option.value === unit)?.multiplier ?? 1;
  return value * multiplier;
};

const deriveUnitFromDays = (days: number): DurationUnit => {
  if (days > 0 && days % 30 === 0) return "months";
  if (days > 0 && days % 7 === 0) return "weeks";
  return "days";
};

const convertDaysToUnitValue = (days: number, unit: DurationUnit) => {
  const multiplier =
    DURATION_UNITS.find((option) => option.value === unit)?.multiplier ?? 1;
  return Math.max(1, Math.round(days / multiplier));
};

const parseDateIso = (value: string) => {
  const parts = String(value).split("-");
  if (parts.length !== 3) return null;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatDateDisplay = (value: string) => {
  const date = parseDateIso(value);
  if (!date) return value;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}.${month}.${year}`;
};

export default function DatesAndDuration() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });
  const durationDays = Number(useWatch({ control, name: "durationDays" }) || 0);
  const ongoing = Boolean(useWatch({ control, name: "ongoing" }));

  const [displayUnit, setDisplayUnit] = useState<DurationUnit>(() =>
    deriveUnitFromDays(durationDays || 30),
  );

  const displayValue = useMemo(() => {
    const sourceDays = durationDays || unitToDays(1, displayUnit);
    return convertDaysToUnitValue(sourceDays, displayUnit);
  }, [displayUnit, durationDays]);

  const calculateEndDateFromStartAndDuration = (
    start: string,
    days: number,
  ): string | null => {
    const s = parseDateIso(String(start));
    if (!s) return null;

    const safeDays = Math.max(1, Math.round(days));
    const e = new Date(s);
    e.setUTCDate(e.getUTCDate() + (safeDays - 1));

    return e.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (ongoing) return;
    if (!startDate || !durationDays) return;

    const endStr = calculateEndDateFromStartAndDuration(
      String(startDate),
      durationDays,
    );
    if (!endStr) return;

    if (endStr !== String(endDate)) {
      setValue("endDate", endStr, { shouldDirty: true });
    }
  }, [startDate, endDate, durationDays, ongoing, setValue]);

  useEffect(() => {
    if (ongoing) return;
    if (!startDate || !endDate) return;

    const s = parseDateIso(String(startDate));
    const e = parseDateIso(String(endDate));
    if (!s || !e) return;

    const diffMs = e.getTime() - s.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 1) {
      setValue("endDate", startDate, { shouldDirty: true });
    }
  }, [startDate, endDate, ongoing, setValue]);

  const updateDurationDays = (nextDays: number) => {
    const safeDays = Math.max(1, Math.round(nextDays));
    setValue("durationDays", safeDays, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleValueChange = (value: number) => {
    const safeValue = Number.isNaN(value) ? 1 : Math.max(1, Math.round(value));
    updateDurationDays(unitToDays(safeValue, displayUnit));
  };

  const handleUnitChange = (unit: DurationUnit) => {
    setDisplayUnit(unit);
    updateDurationDays(unitToDays(displayValue, unit));
  };

  const handlePreset = (days: number) => {
    const derivedUnit = deriveUnitFromDays(days);
    setDisplayUnit(derivedUnit);
    updateDurationDays(days);
    if (ongoing) {
      setValue("ongoing", false, { shouldDirty: true });
    }
  };

  const toggleOngoing = () => {
    const next = !ongoing;
    setValue("ongoing", next, { shouldDirty: true });

    if (!next && startDate && durationDays) {
      const endStr = calculateEndDateFromStartAndDuration(
        String(startDate),
        durationDays,
      );
      if (endStr) {
        setValue("endDate", endStr, { shouldDirty: true });
      }
    }
  };

  const startError = errors.startDate?.message as string | undefined;
  const endError = errors.endDate?.message as string | undefined;
  const durationError = errors.durationDays?.message as string | undefined;

  return (
    <div className="mt-0 space-y-4 sm:mt-0 sm:space-y-6">
      <input
        type="number"
        className="hidden"
        {...register("durationDays", {
          valueAsNumber: true,
          min: { value: 1, message: "Must be at least 1 day" },
          required: "Duration is required",
        })}
      />
      <input type="checkbox" className="hidden" {...register("ongoing")} />

      <div className="rounded-[20px] border border-[#E0E7FF] bg-white px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111827] sm:text-[18px]">
            Treatment Duration
            <HelpTooltip placement="bottom">
              <div className="space-y-2">
                <p>
                  Choose how long you&apos;ll continue this medication. You can
                  pause or extend later if your doctor changes the plan.
                </p>
                <ul className="list-disc space-y-1 pl-4 text-white/80">
                  <li>Use quick presets for common durations.</li>
                  <li>Switch to ongoing for lifetime therapies.</li>
                </ul>
              </div>
            </HelpTooltip>
          </div>
          <p className="text-xs text-[#6B7280] sm:text-sm">
            How long will you take this medication?
          </p>
        </div>

        <button
          type="button"
          onClick={toggleOngoing}
          className={`mt-3 flex w-full items-start gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-left transition sm:mt-5 sm:w-auto sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 ${
            ongoing
              ? "border-[#111827] bg-[#111827] text-white"
              : "border-[#D1D5DB] bg-white text-[#111827] hover:border-[#93C5FD]"
          }`}
        >
          <span
            className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 sm:h-7 sm:w-7 ${
              ongoing ? "border-white bg-white/20" : "border-[#9CA3AF] bg-white"
            }`}
          >
            {ongoing && (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-4 w-4 sm:h-5 sm:w-5"
              >
                <path d="M5 10.5 8.5 14 15 6" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <span className="text-xs font-semibold sm:text-sm">
            Ongoing
            <br />
            (lifetime medication)
          </span>
        </button>

        <div className="mt-3 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#111827] sm:text-sm">
              Duration
            </label>
            <input
              type="number"
              min={1}
              value={displayValue}
              onChange={(event) =>
                handleValueChange(Number(event.target.value))
              }
              disabled={ongoing}
              className="mt-2 h-[48px] rounded-xl border-2 border-[#E0E7FF] px-3 text-sm font-semibold text-[#0F172A] transition outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[56px] sm:rounded-2xl sm:px-4 sm:text-lg"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-[#111827] sm:text-sm">
              Units
            </label>
            <div className="relative mt-2">
              <select
                value={displayUnit}
                onChange={(event) =>
                  handleUnitChange(event.target.value as DurationUnit)
                }
                disabled={ongoing}
                className="h-[48px] w-full appearance-none rounded-xl border-2 border-[#E0E7FF] bg-white px-3 pr-9 text-sm font-medium text-[#0F172A] transition outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[56px] sm:rounded-2xl sm:px-4 sm:pr-10 sm:text-base"
              >
                {DURATION_UNITS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#9CA3AF]">
                <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            </div>
          </div>
        </div>
        {durationError && (
          <p className="mt-2 text-xs text-[#DC2626] sm:text-sm">
            {durationError}
          </p>
        )}

        <div className="mt-4 sm:mt-6">
          <p className="text-xs font-semibold text-[#111827] sm:text-sm">
            Quick presets (optional)
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:mt-3 sm:grid-cols-3 sm:gap-3">
            {DURATION_PRESETS.map((preset) => {
              const isActive =
                !ongoing && Number(durationDays) === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={ongoing}
                  onClick={() => handlePreset(preset.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm ${
                    isActive
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A]"
                      : "border-[#E2E8F0] text-[#1F2A44] hover:border-[#BFDBFE] hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-sm sm:rounded-[24px] sm:px-6 sm:py-6">
        <p className="text-sm font-semibold text-[#111827] sm:text-base">
          Schedule dates
        </p>
        <p className="text-xs text-[#6B7280] sm:text-sm">
          Adjust start and end dates if your plan changes.
        </p>
        <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#111827] sm:text-sm">
              Start date
            </label>
            <div className={`${styles.dateInputWrapper} relative mt-2`}>
              <Input
                type="date"
                className={`${styles.dateInput} h-[48px] w-full rounded-xl border-2 border-[#E0E7FF] pr-10 pl-3 text-sm sm:h-[52px] sm:rounded-2xl sm:pr-12 sm:pl-4 sm:text-base`}
                {...register("startDate", {
                  required: "Start date is required",
                })}
              />
              <span className={styles.dateIcon}>
                <CalendarIcon className={styles.dateIconGlyph} />
              </span>
            </div>
            {startError && (
              <p className="mt-1 text-xs text-[#DC2626] sm:text-sm">
                {startError}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[#111827] sm:text-sm">
              End date
            </label>
            <div className={`${styles.dateInputWrapper} relative mt-2`}>
              <Input
                type="date"
                disabled={ongoing}
                className={`${styles.dateInput} h-[48px] w-full rounded-xl border-2 border-[#E0E7FF] pr-10 pl-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:h-[52px] sm:rounded-2xl sm:pr-12 sm:pl-4 sm:text-base`}
                {...register("endDate", {
                  validate: (value) => {
                    if (!ongoing && !value) {
                      return "End date is required";
                    }
                    return true;
                  },
                })}
              />
              <span className={styles.dateIcon}>
                <CalendarIcon className={styles.dateIconGlyph} />
              </span>
            </div>
            {!ongoing && (
              <p className="mt-1 text-xs text-[#6B7280]">
                End date is calculated automatically from start date and
                duration. You can adjust it if needed.
              </p>
            )}
            {!ongoing && endError && (
              <p className="mt-1 text-xs text-[#DC2626] sm:text-sm">
                {endError}
              </p>
            )}
          </div>
        </div>
        {!ongoing && startDate && endDate && (
          <p className="mt-3 rounded-xl bg-[#F9FAFB] px-3 py-2.5 text-xs text-[#1F2937] sm:mt-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            Schedule:
            <br />
            <strong>{formatDateDisplay(String(startDate))}</strong> →{" "}
            <strong>{formatDateDisplay(String(endDate))}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
