"use client";

import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { getMedicationFormLabel } from "@/lib/medicationTypes";

import { MEAL_TIMING_META, PRESET_TIME_SLOTS, TIME_LABELS } from "../constants";
import { formatDateLabel, formatTimeValue } from "../utils/time";

type Props = {
  values: FormValues;
  timesOfDay: TimeOfDay[];
  customTimes: string[];
  days: string[];
};

export function ReviewStep({ values, timesOfDay, customTimes, days }: Props) {
  const slotOrder = PRESET_TIME_SLOTS;
  const selectedSlots = slotOrder.filter((slot) => timesOfDay.includes(slot));
  const displayedSlots =
    selectedSlots.length > 0
      ? selectedSlots
      : customTimes.length > 0
        ? []
        : [slotOrder[0]];
  const dosesPerDay = Number(values.frequency) || 1;
  const quantityDisplay = Number(values.quantity);
  const safeQuantity =
    Number.isFinite(quantityDisplay) && quantityDisplay > 0
      ? quantityDisplay
      : 0;
  const formLabel = getMedicationFormLabel(values.form);
  const mealTiming = MEAL_TIMING_META[values.mealTiming ?? "before"];

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.07)] sm:rounded-[24px] sm:px-6 sm:py-6">
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase sm:text-sm">
          Medication
        </p>
        <h3 className="mt-1 text-xl font-semibold text-[#111827] sm:text-2xl">
          {values.name?.trim() || "Medication"}
        </h3>
        <p className="mt-1 text-xs text-gray-600 sm:text-base">
          {safeQuantity} {formLabel || values.form || "units"},{" "}
          {Number(values.dosageMg) || 0} mg
        </p>
      </div>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        <div className="rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:rounded-[20px] sm:px-5 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#111827] sm:text-base">
              Schedule
            </p>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#1479FF] sm:text-sm">
                {mealTiming.label}
              </p>
              <p className="text-xs text-gray-500 sm:text-sm">
                {mealTiming.description}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {displayedSlots.map((slot) => {
              const field =
                slot === "morning"
                  ? "morningTime"
                  : slot === "afternoon"
                    ? "afternoonTime"
                    : "eveningTime";
              const value = values[field];
              return (
                <div
                  key={slot}
                  className="flex items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2.5 sm:gap-3 sm:rounded-[16px] sm:px-4 sm:py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0F2FE] sm:h-10 sm:w-10">
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1D9BF0"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="7" />
                      <path d="M12 9v4l2 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827] sm:text-base">
                      {TIME_LABELS[slot]}
                    </p>
                    <p className="text-xs text-gray-600 sm:text-sm">
                      {formatTimeValue(value)}
                    </p>
                  </div>
                </div>
              );
            })}
            {customTimes.map((time, index) => (
              <div
                key={`${time}-${index}`}
                className="flex items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2.5 sm:gap-3 sm:rounded-[16px] sm:px-4 sm:py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] sm:h-10 sm:w-10">
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="7" />
                    <path d="M12 9v4l2 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#111827] sm:text-base">
                    Custom time {index + 1}
                  </p>
                  <p className="text-xs text-gray-600 sm:text-sm">
                    {formatTimeValue(time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {selectedSlots.length === 0 && customTimes.length === 0 && (
            <p className="mt-2 text-xs text-[#D97706] sm:mt-3 sm:text-sm">
              Choose a time of day on Step 2 to finish your schedule.
            </p>
          )}
        </div>

        <div className="rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:rounded-[20px] sm:px-5 sm:py-5">
          <p className="text-sm font-semibold text-[#111827] sm:text-base">
            Weekly Frequency
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
            {days.map((d) => (
              <span
                key={d}
                className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-medium text-[#1E40AF] sm:px-3 sm:py-1 sm:text-sm"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-[12px] border border-white bg-white px-3 py-2.5 shadow-sm sm:mt-5 sm:rounded-[16px] sm:px-4 sm:py-3">
            <p className="text-xs text-gray-600 sm:text-sm">Doses per day</p>
            <p className="text-xl font-semibold text-[#111827] sm:text-2xl">
              {dosesPerDay}x daily
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:rounded-[20px] sm:px-5 sm:py-5">
        <p className="text-sm font-semibold text-[#111827] sm:text-base">
          Duration
        </p>
        {values.ongoing ? (
          <p className="mt-2 text-xs text-gray-600 sm:text-base">
            Ongoing (lifetime medication)
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-gray-600 sm:text-base">
              {Number(values.durationDays) || 0} days total
            </p>
            <p className="text-xs text-gray-500 sm:text-sm">
              {formatDateLabel(values.startDate)} {"\u2192"}{" "}
              {formatDateLabel(values.endDate)}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
