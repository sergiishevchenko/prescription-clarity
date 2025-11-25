export type MealTiming = "before" | "with" | "after" | "anytime";

export type ScheduleEntryWithRelations = {
  id: string;
  scheduleId: string | null;
  medicationId: string | null;
  userId: string;
  dateTime: Date;
  status: "PLANNED" | "DONE";
  createdAt: Date;
  updatedAt: Date;
  medication: { id: string; name: string; dose: number | null } | null;
  schedule: {
    quantity: number;
    units: string;
    mealTiming: string;
  } | null;
};

export interface ScheduleEntryPrintable {
  dateUtc: Date;
  mealTiming: MealTiming;
  medicationName: string;
  medDetails: string;
  quantityLabel: string;
  statusLabel: string;
}

const DEFAULT_UNITS = "unit";

export function toPrintableEntries(
  entries: ScheduleEntryWithRelations[],
): ScheduleEntryPrintable[] {
  return entries.map((entry) => {
    const quantity = entry.schedule?.quantity ?? 1;
    const units = entry.schedule?.units ?? DEFAULT_UNITS;
    const dose =
      entry.medication?.dose !== null && entry.medication?.dose !== undefined
        ? `${entry.medication?.dose} mg`
        : "No dose set";
    return {
      dateUtc: entry.dateTime,
      mealTiming: normalizeMealTiming(entry.schedule?.mealTiming),
      medicationName: entry.medication?.name ?? "Medication",
      medDetails: dose,
      quantityLabel: `${quantity} ${units}`,
      statusLabel: entry.status === "DONE" ? "Taken" : "Planned",
    };
  });
}

function normalizeMealTiming(value: string | null | undefined): MealTiming {
  if (value === "before" || value === "with" || value === "after") {
    return value;
  }
  return "anytime";
}
