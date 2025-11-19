import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { DAY_LABELS } from "@/lib/medicationTypes";

import { PRESET_DEFAULT_TIMES, PRESET_TIME_FIELDS } from "../constants";
import { normalizeTimeValue, sanitizeCustomTimes } from "./time";

const DAY_TO_INDEX = DAY_LABELS.reduce<
  Record<(typeof DAY_LABELS)[number], number>
>(
  (acc, label, index) => {
    acc[label] = index + 1;
    return acc;
  },
  {} as Record<(typeof DAY_LABELS)[number], number>,
);

export const mapFormToSchedulePayload = (
  values: FormValues,
  timesOfDay: TimeOfDay[],
  days: string[],
) => {
  const frequencyDays = Array.from(
    new Set(
      days
        .map((label) => DAY_TO_INDEX[label as (typeof DAY_LABELS)[number]])
        .filter((day): day is number => typeof day === "number"),
    ),
  ).sort((a, b) => a - b);

  const presetTimes = timesOfDay
    .map((slot) => {
      const field = PRESET_TIME_FIELDS[slot];
      const rawValue = values[field];
      return normalizeTimeValue(rawValue) ?? PRESET_DEFAULT_TIMES[slot];
    })
    .filter((time): time is string => Boolean(time));

  const customTimes = sanitizeCustomTimes(values.customTimes);
  const timeOfDay = [...presetTimes, ...customTimes];

  return {
    medicationId: values.medicationId ?? "",
    quantity: Math.max(1, Math.round(Number(values.quantity) || 1)),
    units: values.form?.trim() ? values.form : "pill",
    frequencyDays,
    durationDays: values.ongoing
      ? 0
      : Math.max(0, Math.round(Number(values.durationDays) || 0)),
    dateStart: values.startDate,
    timeOfDay,
    mealTiming: values.mealTiming ?? "anytime",
  };
};
