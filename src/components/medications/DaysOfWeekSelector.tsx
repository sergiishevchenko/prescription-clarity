"use client";

import { DAY_LABELS } from "@/lib/medicationTypes";

type Props = {
  selected: string[];
  onToggle: (label: string) => void;
};

export default function DaysOfWeekSelector({ selected, onToggle }: Props) {
  return (
    <div>
      <label className="block text-base font-medium text-gray-900">Days of Week</label>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {DAY_LABELS.map((d) => {
          const active = selected.includes(d);
          const base = "rounded-xl border px-3 py-2 text-sm font-medium transition-colors";
          const cls = active
            ? " border-indigo-600 bg-indigo-600 text-white"
            : " border-gray-300 bg-white text-gray-900 hover:bg-gray-50";
          return (
            <button key={d} type="button" onClick={() => onToggle(d)} className={base + cls}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

