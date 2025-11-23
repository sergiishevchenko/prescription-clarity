import { useCallback, useMemo, useState } from "react";

import type { TimeOfDay } from "@/lib/medicationTypes";

type Params = {
  initialSlots: TimeOfDay[];
  frequency: number;
  customTimesCount: number;
};

const clampSlots = (slots: TimeOfDay[], limit: number) => {
  if (limit <= 0) return [];
  return slots.slice(-limit);
};

export const useTimeOfDaySelections = ({
  initialSlots,
  frequency,
  customTimesCount,
}: Params) => {
  const [selectedSlots, setSelectedSlots] = useState<TimeOfDay[]>(() => [
    ...initialSlots,
  ]);

  const required = useMemo(
    () => Math.max(1, Number.isFinite(frequency) ? Number(frequency) : 1),
    [frequency],
  );

  // Preset (morning/afternoon/evening) selections are controlled only
  // by the chosen frequency, not by the number of custom times.
  const maxPresets = useMemo(
    () => Math.max(0, Math.min(required, 3)),
    [required],
  );

  const timesOfDay = useMemo(
    () => clampSlots(selectedSlots, maxPresets),
    [selectedSlots, maxPresets],
  );

  const timeError = useMemo(() => {
    const presetCount = timesOfDay.length;
    const totalSelected = presetCount + customTimesCount;

    if (customTimesCount > 6) {
      return "You can add up to 6 custom reminders per day.";
    }
    if (totalSelected === 0) {
      return "Please select at least one time of day.";
    }
    if (required > 0 && totalSelected < required) {
      const remaining = required - totalSelected;
      return remaining === 1
        ? "Please select 1 more time of day."
        : `Please select ${remaining} more times of day.`;
    }
    return "";
  }, [customTimesCount, required, timesOfDay.length]);

  const toggleTime = useCallback(
    (slot: TimeOfDay) => {
      setSelectedSlots((prev) => {
        const current = clampSlots(prev, maxPresets);
        if (current.includes(slot)) {
          return current.filter((t) => t !== slot);
        }
        if (maxPresets === 0) {
          return current;
        }
        if (current.length >= maxPresets) {
          return [...current.slice(1), slot];
        }
        return [...current, slot];
      });
    },
    [maxPresets],
  );

  const resetTimes = useCallback(
    (slots?: TimeOfDay[]) => {
      if (!slots || slots.length === 0) {
        setSelectedSlots([]);
        return;
      }
      setSelectedSlots(clampSlots(slots, maxPresets));
    },
    [maxPresets],
  );

  return { timesOfDay, timeError, toggleTime, resetTimes };
};
