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
  const activeSlots = (["morning", "afternoon", "evening"] as TimeOfDay[]).filter(
    (slot) => selected.includes(slot),
  );

  if (!activeSlots.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {activeSlots.map((slot) => {
        const meta = INPUT_META[slot];
        return (
          <section
            key={slot}
            className="rounded-[28px] border border-[#E0E7FF] bg-white px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={stepStyles.labelText}>
                  {meta.label} Reminder
                </p>
                <p className={stepStyles.helperText}>{meta.helper}</p>
              </div>
              <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[#4338CA]">
                Time
              </span>
            </div>
            <Input
              type="time"
              step={900}
              className="mt-4 h-[56px] rounded-[16px] border-[1.5px] border-[#C7D7FE] bg-[#F8FAFF] px-4 text-[16px] font-semibold text-[#1F2A44] focus:border-[#1479FF] focus:ring-2 focus:ring-[#1479FF]/30"
              {...register(meta.field)}
            />
          </section>
        );
      })}
    </div>
  );
}
