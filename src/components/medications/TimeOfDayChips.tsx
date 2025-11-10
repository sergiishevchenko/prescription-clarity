"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";

type Props = {
  selected: TimeOfDay[];
  onToggle: (slot: TimeOfDay) => void;
  error?: string;
};

export default function TimeOfDayChips({ selected, onToggle, error }: Props) {
  const { control } = useFormContext<FormValues>();
  const freq = useWatch({ control, name: "frequency" });

  const frequencyLabel = useMemo(() => {
    const map: Record<number, string> = { 1: "one", 2: "two", 3: "three" };
    return map[(freq as unknown as number) || 1] || "one";
  }, [freq]);

  return (
    <div>
      <label className="block text-base font-medium text-gray-900">
        Time of Day (Select {frequencyLabel})
      </label>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["morning", "afternoon", "evening"] as TimeOfDay[]).map((slot) => {
          const active = selected.includes(slot);
          const base =
            "rounded-xl border px-4 py-3 text-center text-base transition-colors";
          const cls = active
            ? " border-indigo-600 bg-indigo-600 text-white"
            : " border-gray-300 bg-white text-gray-900 hover:bg-gray-50";
          const label = slot.charAt(0).toUpperCase() + slot.slice(1);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onToggle(slot)}
              className={base + cls}
            >
              {label}
            </button>
          );
        })}
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}
    </div>
  );
}
