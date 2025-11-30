"use client";

import { Input } from "@/components/ui/Input";
import { useFormContext } from "react-hook-form";

import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import stepStyles from "./MedicationWizardStep1.module.css";

type Props = {
  selected: TimeOfDay[];
};

type TimeFieldName = "morningTime" | "afternoonTime" | "eveningTime";

const INPUT_META: Record<
  TimeOfDay,
  { label: string; helper: string; field: TimeFieldName }
> = {
  morning: {
    label: "Morning",
    helper: "Set your first reminder of the day.",
    field: "morningTime",
  },
  afternoon: {
    label: "Afternoon",
    helper: "Perfect for lunchtime reminders.",
    field: "afternoonTime",
  },
  evening: {
    label: "Evening",
    helper: "Schedule your nightly dose.",
    field: "eveningTime",
  },
};

export default function TimeInputs({ selected }: Props) {
  const { register } = useFormContext<FormValues>();
  const activeSlots = (
    ["morning", "afternoon", "evening"] as TimeOfDay[]
  ).filter((slot) => selected.includes(slot));

  if (!activeSlots.length) {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {activeSlots.map((slot) => {
        const meta = INPUT_META[slot];
        return (
          <section
            key={slot}
            className="rounded-[20px] border border-[#E0E7FF] bg-white px-4 py-3.5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:px-6 sm:py-5"
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div>
                <p className={stepStyles.labelText}>{meta.label} Reminder</p>
                <p className={stepStyles.helperText}>{meta.helper}</p>
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#4338CA] uppercase sm:px-3 sm:py-1 sm:text-[12px]">
                Time
              </span>
            </div>
            <Input
              type="time"
              step={900}
              className="mt-3 h-[48px] rounded-[14px] border-[1.5px] border-[#C7D7FE] bg-[#F8FAFF] px-3 text-[14px] font-semibold text-[#1F2A44] focus:border-[#1479FF] focus:ring-2 focus:ring-[#1479FF]/30 sm:mt-4 sm:h-[56px] sm:rounded-[16px] sm:px-4 sm:text-[16px]"
              {...register(meta.field)}
            />
          </section>
        );
      })}
    </div>
  );
}
