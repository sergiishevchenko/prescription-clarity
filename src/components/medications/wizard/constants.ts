import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";

export const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const MEAL_LABELS: Record<FormValues["mealTiming"], string> = {
  before: "Take before meal",
  with: "Take with meal",
  after: "Take after meal",
  anytime: "Take anytime",
};

export const FREQUENCY_OPTIONS = [
  { value: 1, label: "1x", description: "Once" },
  { value: 2, label: "2x", description: "Twice" },
  { value: 3, label: "3x", description: "Three times" },
] as const;

export type MealTimingOption = {
  value: FormValues["mealTiming"];
  label: string;
  description: string;
};

export const MEAL_TIMING_OPTIONS: MealTimingOption[] = [
  { value: "before", label: "Before Meal", description: "30 min before" },
  { value: "with", label: "With Meal", description: "During meal" },
  { value: "after", label: "After Meal", description: "30 min after" },
  { value: "anytime", label: "Anytime", description: "No restriction" },
];

export const MEAL_TIMING_META: Record<
  FormValues["mealTiming"],
  MealTimingOption
> = MEAL_TIMING_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option;
    return acc;
  },
  {} as Record<FormValues["mealTiming"], MealTimingOption>,
);

export const FRACTION_OPTIONS = [
  { value: 0, label: "-" },
  { value: 0.25, label: "1/4" },
  { value: 0.5, label: "1/2" },
  { value: 0.75, label: "3/4" },
] as const;

export const PRESET_TIME_SLOTS: TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
];

export const PRESET_TIME_FIELDS: Record<
  TimeOfDay,
  keyof Pick<FormValues, "morningTime" | "afternoonTime" | "eveningTime">
> = {
  morning: "morningTime",
  afternoon: "afternoonTime",
  evening: "eveningTime",
};

export const PRESET_DEFAULT_TIMES: Record<TimeOfDay, string> = {
  morning: "07:30",
  afternoon: "12:30",
  evening: "18:30",
};

export const MIN_NAME_LENGTH_FOR_LIBRARY = 3;

export const WIZARD_RESET_EVENT = "medication-wizard-reset";
