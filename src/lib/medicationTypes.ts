export type MealTiming = "before" | "with" | "after" | "anytime";
export type TimeOfDay = "morning" | "afternoon" | "evening";
export const MEDICATION_FORMS = [
  "tablets",
  "capsules",
  "lozenges",
  "candy",
  "drops",
  "ampoule",
  "syringe",
  "packet",
  "sachet",
  "stick",
  "g",
  "mg",
  "ml",
  "dose",
  "teaspoon",
  "tablespoon",
] as const;

export type MedicationForm = (typeof MEDICATION_FORMS)[number];

export const MEDICATION_FORM_LABELS: Record<MedicationForm, string> = {
  tablets: "Tablets",
  capsules: "Capsules",
  lozenges: "Lozenges",
  candy: "Candy",
  drops: "Drops",
  ampoule: "Ampoule",
  syringe: "Syringe",
  packet: "Packet",
  sachet: "Sachet",
  stick: "Stick",
  g: "Grams (g)",
  mg: "Milligrams (mg)",
  ml: "Milliliters (ml)",
  dose: "Dose",
  teaspoon: "Teaspoon",
  tablespoon: "Tablespoon",
};

export const getMedicationFormLabel = (value?: MedicationForm) => {
  if (!value) return "";
  return MEDICATION_FORM_LABELS[value] ?? value;
};

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
  medicationId?: string;
  name: string;
  quantity?: number;
  dosageMg?: number;
  form?: MedicationForm;
  mealTiming: MealTiming;
  frequency: number; // times per day
  durationDays: number; // total duration in days
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  ongoing: boolean;
  morningTime?: string;
  afternoonTime?: string;
  eveningTime?: string;
  customTimes?: string[];
  photo?: FileList;
};
