import type { ScheduleTemplateItem } from "@/lib/schedule";

export type ScheduleCardData = {
  id: string;
  medication: {
    id: string;
    name: string;
    dose: number | null;
    form?: string | null;
  } | null;
  medicationId: string;
  quantity: number;
  units: string;
  frequencyDays: number[];
  durationDays: number;
  dateStart: string;
  dateEnd: string | null;
  timeOfDay: string[];
  mealTiming: "before" | "with" | "after" | "anytime";
  createdAt: string;
  updatedAt: string;
};

export type ScheduleSummary = {
  weekLabel: string;
  totalEntries: number;
  takenCount: number;
  plannedCount: number;
  upcomingCount: number;
};

export function mapScheduleTemplateToCard(
  template: ScheduleTemplateItem,
): ScheduleCardData {
  return {
    id: template.id,
    medication: template.medication,
    medicationId: template.medicationId,
    quantity: template.quantity,
    units: template.units,
    frequencyDays: template.frequencyDays,
    durationDays: template.durationDays,
    dateStart: template.dateStart.split("T")[0] ?? template.dateStart,
    dateEnd: template.dateEnd
      ? (template.dateEnd.split("T")[0] ?? template.dateEnd)
      : null,
    timeOfDay: template.timeOfDay,
    mealTiming: template.mealTiming,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
