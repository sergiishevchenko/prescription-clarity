"use client";

import type { ReactNode } from "react";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import DaysOfWeekSelector from "../../DaysOfWeekSelector";
import stepStyles from "../../MedicationWizardStep1.module.css";

type Props = {
  medicationSummary: ReactNode | null;
  selectedDays: string[];
  onToggleDay: (label: string) => void;
  onApplyPreset: (labels: readonly string[]) => void;
};

export function WeeklyFrequencyStep({
  medicationSummary,
  selectedDays,
  onToggleDay,
  onApplyPreset,
}: Props) {
  return (
    <section className={stepStyles.step}>
      <div className={stepStyles.surface}>
        {medicationSummary}
        <div className="mt-0 flex flex-col gap-2.5 sm:mt-0 sm:gap-3">
          <label className="flex items-center text-base font-medium text-gray-900">
            Select Days of the Week
            <span className="ml-1 text-red-500">*</span>
            <HelpTooltip>
              <div className="space-y-2 text-left">
                <p className="text-base font-semibold text-white">
                  Choose which days you need to take this medication.
                </p>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Quick options:
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/80">
                    <li>
                      <strong>All Days:</strong> Every day of the week
                    </li>
                    <li>
                      <strong>Weekdays:</strong> Monday to Friday only
                    </li>
                    <li>
                      <strong>Weekends:</strong> Saturday and Sunday only
                    </li>
                    <li>
                      <strong>Custom:</strong> Tap individual days below
                    </li>
                  </ul>
                </div>
                <p className="flex items-start gap-2 text-sm text-[#FBBF24]">
                  <span aria-hidden="true">💡</span>
                  <span>
                    Some medications are only needed on specific days (e.g.,
                    weekly supplements on Sundays).
                  </span>
                </p>
              </div>
            </HelpTooltip>
          </label>
          <DaysOfWeekSelector
            selected={selectedDays}
            onToggle={onToggleDay}
            onApplyPreset={onApplyPreset}
          />
        </div>
      </div>
    </section>
  );
}
