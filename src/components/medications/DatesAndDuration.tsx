"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/ui/Input";
import type { FormValues } from "@/lib/medicationTypes";

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

  // Допоміжна функція для обчислення кінцевої дати
  const calculateEndDateFromStartAndDuration = (
    start: string,
    days: number,
  ): string | null => {
    const s = parseDateIso(String(start));
    if (!s) return null;

    const safeDays = Math.max(1, Math.round(days));
    const e = new Date(s);
    // включно: 1 день => +0, 7 днів => +6
    e.setUTCDate(e.getUTCDate() + (safeDays - 1));

    return e.toISOString().slice(0, 10);
  };

  // Коли змінюються startDate / durationDays і курс не ongoing — перераховуємо endDate
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

  // Стежимо, щоб endDate не був раніше за startDate
  useEffect(() => {
    if (ongoing) return;
    if (!startDate || !endDate) return;

    const s = parseDateIso(String(startDate));
    const e = parseDateIso(String(endDate));
    if (!s || !e) return;

    const diffMs = e.getTime() - s.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays < 1) {
      // end date не може бути раніше start date
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

    // Якщо переходимо з ongoing = true на false — одразу порахувати endDate
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
    <div className="space-y-6">
      {/* durationDays у формі як hidden field */}
      <input
        type="number"
        className="hidden"
        {...register("durationDays", {
          valueAsNumber: true,
          min: { value: 1, message: "Must be at least 1 day" },
          required: "Duration is required",
        })}
      />
      {/* ongoing у формі як hidden checkbox */}
      <input type="checkbox" className="hidden" {...register("ongoing")} />

      <div className="rounded-[28px] border border-[#E0E7FF] bg-white px-6 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[18px] font-semibold text-[#111827]">
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
          <p className="text-sm text-[#6B7280]">
            How long will you take this medication?
          </p>
        </div>

        <button
          type="button"
          onClick={toggleOngoing}
          className={`mt-5 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition ${
            ongoing
              ? "border-[#111827] bg-[#111827] text-white"
              : "border-[#D1D5DB] bg-white text-[#111827] hover:border-[#93C5FD]"
          }`}
        >
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
              ongoing ? "border-white bg-white/20" : "border-[#9CA3AF] bg-white"
            }`}
          >
            {ongoing && (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3 w-3"
              >
                <path d="M5 10.5 8.5 14 15 6" strokeLinecap="round" />
              </svg>
            )}
          </span>
          <span className="text-sm font-semibold">
            Ongoing (lifetime medication)
          </span>
        </button>

        <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[#111827]">
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
              className="mt-2 h-[56px] rounded-2xl border-2 border-[#E0E7FF] px-4 text-lg font-semibold text-[#0F172A] transition outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[#111827]">
              Units
            </label>
            <select
              value={displayUnit}
              onChange={(event) =>
                handleUnitChange(event.target.value as DurationUnit)
              }
              disabled={ongoing}
              className="mt-2 h-[56px] rounded-2xl border-2 border-[#E0E7FF] bg-white px-4 text-base font-medium text-[#0F172A] transition outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DURATION_UNITS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {durationError && (
          <p className="mt-2 text-sm text-[#DC2626]">{durationError}</p>
        )}

        <div className="mt-6">
          <p className="text-sm font-semibold text-[#111827]">
            Quick presets (optional)
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DURATION_PRESETS.map((preset) => {
              const isActive =
                !ongoing && Number(durationDays) === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={ongoing}
                  onClick={() => handlePreset(preset.value)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
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

      <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-sm">
        <p className="text-base font-semibold text-[#111827]">Schedule dates</p>
        <p className="text-sm text-[#6B7280]">
          Adjust start and end dates if your plan changes.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#111827]">
              Start date
            </label>
            <Input
              type="date"
              className="mt-2 h-[52px] rounded-2xl border-2 border-[#E0E7FF] px-4 text-base"
              {...register("startDate", { required: "Start date is required" })}
            />
            {startError && (
              <p className="mt-1 text-sm text-[#DC2626]">{startError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-[#111827]">
              End date
            </label>
            <Input
              type="date"
              disabled={ongoing}
              className="mt-2 h-[52px] rounded-2xl border-2 border-[#E0E7FF] px-4 text-base disabled:cursor-not-allowed disabled:opacity-50"
              {...register("endDate", {
                validate: (value) => {
                  if (!ongoing && !value) {
                    return "End date is required";
                  }
                  return true;
                },
              })}
            />
            {!ongoing && (
              <p className="mt-1 text-xs text-[#6B7280]">
                End date is calculated automatically from start date and
                duration. You can adjust it if needed.
              </p>
            )}
            {!ongoing && endError && (
              <p className="mt-1 text-sm text-[#DC2626]">{endError}</p>
            )}
          </div>
        </div>
        {!ongoing && startDate && endDate && (
          <p className="mt-4 rounded-2xl bg-[#F9FAFB] px-4 py-3 text-sm text-[#1F2937]">
            Schedule: <strong>{formatDateDisplay(String(startDate))}</strong> →{" "}
            <strong>{formatDateDisplay(String(endDate))}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
