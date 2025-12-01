"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import stepStyles from "./MedicationWizardStep1.module.css";
import { TIME_OF_DAY_ICONS } from "./TimeOfDayIcons";

type Props = {
  selected: TimeOfDay[];
  onToggle: (slot: TimeOfDay) => void;
  error?: string;
};

const SLOT_META: Record<TimeOfDay, { label: string; helper: string }> = {
  morning: {
    label: "Morning",
    helper: "8:00 AM",
  },
  afternoon: {
    label: "Afternoon",
    helper: "1:00 PM",
  },
  evening: {
    label: "Evening",
    helper: "7:00 PM",
  },
};

const formatTimeValue = (value?: string) => {
  if (!value) return "Set a time";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes);
  return Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const normalizeCustomTime = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

export default function TimeOfDayChips({ selected, onToggle, error }: Props) {
  const { control, watch, setValue } = useFormContext<FormValues>();
  const freq = useWatch({ control, name: "frequency" });
  const [morningTime, afternoonTime, eveningTime] = watch([
    "morningTime",
    "afternoonTime",
    "eveningTime",
  ]) as Array<string | undefined>;
  const customTimes = (watch("customTimes") as string[] | undefined) ?? [];
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState("08:00");

  const required = Number(freq || 1) || 1;
  const maxCustomTimes = 6;
  const label =
    required === 1 ? "Select 1 Time of Day" : `Select ${required} Times of Day`;
  const totalSelections = selected.length + customTimes.length;
  const selectedCount = Math.min(totalSelections, required);
  const isComplete = totalSelections >= required;
  const statusClass = isComplete
    ? stepStyles.statusSuccess
    : stepStyles.statusWarning;

  const openCustomPicker = () => {
    setCustomTimeValue("08:00");
    setShowCustomPicker(true);
  };

  const handleCustomSave = () => {
    if (customTimes.length >= maxCustomTimes) {
      return;
    }
    const normalized = normalizeCustomTime(customTimeValue) ?? "08:00";
    setValue("customTimes", [...customTimes, normalized], {
      shouldDirty: true,
      shouldValidate: false,
    });
    setShowCustomPicker(false);
  };

  const handleRemoveCustomTime = (index: number) => {
    const nextTimes = customTimes.filter((_, i) => i !== index);
    setValue("customTimes", nextTimes, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const customPreview =
    customTimes.length > 0
      ? `${customTimes.length} custom ${
          customTimes.length === 1 ? "time" : "times"
        }`
      : "Create a reminder at any hour";

  return (
    <div>
      <div className={stepStyles.labelRow}>
        <span className={stepStyles.labelText}>{label}</span>
        <span className={stepStyles.required}>*</span>
        <HelpTooltip>
          Select the preset times of day you take this medication. You can also
          add up to 6 custom times.
        </HelpTooltip>
      </div>
      <div
        className={`${stepStyles.statusRow} ${stepStyles.statusCentered} ${statusClass}`}
      >
        {isComplete ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="m5 11 3 3 7-7" strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v5l3 1" strokeLinecap="round" />
          </svg>
        )}
        {selectedCount} of {required} selected
      </div>
      <div className="time-of-day-grid mt-3 grid grid-cols-1 gap-2.5 sm:mt-4 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((slot) => {
          const active = selected.includes(slot);
          const timeValue =
            slot === "morning"
              ? morningTime
              : slot === "afternoon"
                ? afternoonTime
                : eveningTime;
          const helper = timeValue
            ? formatTimeValue(timeValue)
            : SLOT_META[slot].helper;
          const titleClass = `${stepStyles.cardTitle} ${
            active ? stepStyles.cardTitleActive : ""
          }`;
          const descriptionClass = `${stepStyles.cardDescription} ${
            active ? stepStyles.cardDescriptionActive : ""
          }`;
          const iconColor = active ? "text-[#1479FF]" : "text-[#1F2A44]";
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onToggle(slot)}
              className={`rounded-[18px] border-2 px-3.5 py-3 text-left transition focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none sm:rounded-[22px] sm:px-4 sm:py-4 ${
                active
                  ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                  : "border-[#E5E7EB] bg-white hover:border-[#93C5FD] hover:bg-[#F8FAFF]"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12 ${iconColor}`}
                >
                  {TIME_OF_DAY_ICONS[slot]}
                </div>
                <div>
                  <p className={titleClass}>{SLOT_META[slot].label}</p>
                  <p className={descriptionClass}>{helper}</p>
                </div>
              </div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={openCustomPicker}
          className={`custom-time-button flex items-center gap-3 rounded-[18px] border-2 border-dashed border-[#CBD5F5] bg-white px-3.5 py-3 text-left text-[#1F2A44] transition hover:border-[#1479FF] focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none sm:gap-4 sm:rounded-[22px] sm:px-4 sm:py-4`}
        >
          <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-full bg-[#EEF2FF] text-[#4338CA] sm:h-14 sm:w-14 sm:min-w-[3.5rem]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className={stepStyles.cardTitle}>Add custom time</p>
            <p className={stepStyles.cardDescription}>{customPreview}</p>
          </div>
        </button>
      </div>
      {customTimes.length > 0 && (
        <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
          {customTimes.map((time, index) => (
            <div
              key={`${time}-${index}`}
              className="flex items-center justify-between rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFF] px-3 py-2 sm:rounded-[18px] sm:px-4 sm:py-3"
            >
              <div>
                <p className="text-[14px] font-semibold text-[#111827]">
                  Custom time {index + 1}
                </p>
                <p className="text-[13px] text-gray-600">
                  {formatTimeValue(time)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCustomTime(index)}
                className="rounded-full border border-transparent px-3 py-1 text-[13px] font-semibold text-[#B91C1C] transition hover:border-[#FECACA] hover:bg-[#FEF2F2]"
              >
                Remove
              </button>
            </div>
          ))}
          <p className="text-[13px] text-[#6B7280]">
            You can add up to 6 custom reminders in addition to the preset
            times.
          </p>
        </div>
      )}
      {customTimes.length >= maxCustomTimes && (
        <p className="mt-2 text-[13px] text-[#B91C1C]">
          You&apos;ve added the maximum of 6 custom reminders.
        </p>
      )}
      {showCustomPicker && (
        <div className="mt-3 rounded-[20px] border border-[#E0E7FF] bg-white px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:mt-4 sm:rounded-[28px] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <p className={stepStyles.labelText}>Custom time</p>
              <p className={stepStyles.helperText}>
                Set the exact minute with 15-minute increments. These times
                count toward your daily reminders.
              </p>
              <input
                id="custom-time-value"
                type="time"
                step={900}
                value={customTimeValue}
                onChange={(event) => setCustomTimeValue(event.target.value)}
                className={`${stepStyles.input} mt-2 h-[48px] w-full rounded-[14px] border border-[#E0E7FF] bg-[#F8FAFF] px-3 focus:border-[#1479FF] focus:ring-2 focus:ring-[#1479FF]/30 focus:outline-none sm:mt-3 sm:h-[56px] sm:rounded-[18px] sm:px-4`}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:mt-6 sm:gap-3 md:flex-row">
            <button
              type="button"
              onClick={handleCustomSave}
              className="flex-1 rounded-[14px] bg-gradient-to-r from-[#1479FF] to-[#2DD4BF] px-3.5 py-2.5 text-center text-[14px] font-semibold text-white shadow-[0_18px_35px_rgba(20,121,255,0.3)] transition hover:brightness-105 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-[15px]"
            >
              Apply custom time
            </button>
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="flex-1 rounded-[14px] border border-[#D1D5DB] px-3.5 py-2.5 text-center text-[14px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6] sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-[15px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-[18px] border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3 text-[14px] text-[#92400E]">
          {error}
        </div>
      )}
    </div>
  );
}
