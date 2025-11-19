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

  const maxPresets = useMemo(
    () => Math.max(0, required - Math.max(0, customTimesCount)),
    [customTimesCount, required],
  );

  const timesOfDay = useMemo(
    () => clampSlots(selectedSlots, maxPresets),
    [selectedSlots, maxPresets],
  );

  const timeError = useMemo(() => {
    if (customTimesCount > required) {
      return "Too many custom reminders for this frequency. Remove one.";
    }
    if (maxPresets === 0) return "";
    if (timesOfDay.length < maxPresets) {
      const remaining = maxPresets - timesOfDay.length;
      return remaining === 1
        ? "Please select 1 more time of day."
        : `Please select ${remaining} more times of day.`;
    }
    return "";
  }, [customTimesCount, required, maxPresets, timesOfDay.length]);

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
