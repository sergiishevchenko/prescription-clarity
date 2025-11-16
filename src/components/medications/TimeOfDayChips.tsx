"use client";

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

export default function TimeOfDayChips({ selected, onToggle, error }: Props) {
  const { control, watch } = useFormContext<FormValues>();
  const freq = useWatch({ control, name: "frequency" });
  const [morningTime, afternoonTime, eveningTime] = watch([
    "morningTime",
    "afternoonTime",
    "eveningTime",
  ]) as Array<string | undefined>;

  const required = Number(freq || 1) || 1;
  const label =
    required === 1
      ? "Select 1 Time of Day"
      : `Select ${required} Times of Day`;
  const selectedCount = Math.min(selected.length, required);
  const isComplete = selectedCount === required;
  const statusClass = isComplete
    ? stepStyles.statusSuccess
    : stepStyles.statusWarning;

  return (
    <div>
      <div className={stepStyles.labelRow}>
        <span className={stepStyles.labelText}>{label}</span>
        <span className={stepStyles.required}>*</span>
        <HelpTooltip>
          Select all the times you take this medication each day.
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
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
              className={`rounded-[22px] border-2 px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 ${
                active
                  ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                  : "border-[#E5E7EB] bg-white hover:border-[#93C5FD] hover:bg-[#F8FAFF]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center ${iconColor}`}>
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
      </div>
      {error && (
        <div className="mt-4 rounded-[18px] border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3 text-[14px] text-[#92400E]">
          {error}
        </div>
      )}
    </div>
  );
}
