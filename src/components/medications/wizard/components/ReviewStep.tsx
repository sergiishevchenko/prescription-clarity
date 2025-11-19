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
    <section className="space-y-6">
      <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
        <p className="text-[13px] font-medium tracking-wide text-gray-500 uppercase">
          Medication
        </p>
        <h3 className="mt-1 text-[22px] font-semibold text-[#111827]">
          {values.name?.trim() || "Medication"}
        </h3>
        <p className="mt-1 text-[14px] text-gray-600">
          {safeQuantity} {formLabel || values.form || "units"},{" "}
          {Number(values.dosageMg) || 0} mg
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-[#111827]">Schedule</p>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#1479FF]">
                {mealTiming.label}
              </p>
              <p className="text-[12px] text-gray-500">
                {mealTiming.description}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
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
                  className="flex items-center gap-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F2FE]">
                    <svg
                      className="h-5 w-5"
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
                    <p className="text-[14px] font-semibold text-[#111827]">
                      {TIME_LABELS[slot]}
                    </p>
                    <p className="text-[13px] text-gray-600">
                      {formatTimeValue(value)}
                    </p>
                  </div>
                </div>
              );
            })}
            {customTimes.map((time, index) => (
              <div
                key={`${time}-${index}`}
                className="flex items-center gap-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <svg
                    className="h-5 w-5"
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
                  <p className="text-[14px] font-semibold text-[#111827]">
                    Custom time {index + 1}
                  </p>
                  <p className="text-[13px] text-gray-600">
                    {formatTimeValue(time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {selectedSlots.length === 0 && customTimes.length === 0 && (
            <p className="mt-3 text-[12px] text-[#D97706]">
              Choose a time of day on Step 2 to finish your schedule.
            </p>
          )}
        </div>

        <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <p className="text-[14px] font-semibold text-[#111827]">
            Weekly Frequency
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {days.map((d) => (
              <span
                key={d}
                className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[13px] font-medium text-[#1E40AF]"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-[16px] border border-white bg-white px-4 py-3 shadow-sm">
            <p className="text-[13px] text-gray-600">Doses per day</p>
            <p className="text-[20px] font-semibold text-[#111827]">
              {dosesPerDay}x daily
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <p className="text-[14px] font-semibold text-[#111827]">Duration</p>
        {values.ongoing ? (
          <p className="mt-2 text-[14px] text-gray-600">
            Ongoing (lifetime medication)
          </p>
        ) : (
          <>
            <p className="mt-2 text-[14px] text-gray-600">
              {Number(values.durationDays) || 0} days total
            </p>
            <p className="text-[13px] text-gray-500">
              {formatDateLabel(values.startDate)} {"\u2192"}{" "}
              {formatDateLabel(values.endDate)}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
