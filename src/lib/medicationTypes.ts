export type MealTiming = "before" | "with" | "after" | "anytime";
export type TimeOfDay = "morning" | "afternoon" | "evening";
export type MedicationUnit =
  | "tablets"
  | "capsules"
  | "lozenges"
  | "candy"
  | "drops"
  | "ampoule"
  | "syringe"
  | "packet"
  | "sachet"
  | "stick"
  | "g"
  | "mg"
  | "ml"
  | "dose"
  | "teaspoon"
  | "tablespoon";

export const DAY_LABELS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export type FormValues = {
  name: string;
  quantity: number; // pills/tablets per dose
  dosageMg: number; // mg per dose
  unit: MedicationUnit; // selected medication form
  mealTiming: MealTiming;
  frequency: number; // times per day
  durationDays: number; // total duration in days
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  ongoing: boolean;
  morningTime?: string;
  afternoonTime?: string;
  eveningTime?: string;
  photo?: FileList;
};
