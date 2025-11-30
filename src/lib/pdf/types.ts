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
  medication: {
    id: string;
    name: string;
    dose: number | null;
    form: string | null;
    deletedAt: Date | null;
  } | null;
  schedule: {
    quantity: number;
    units: string;
    mealTiming: string;
  } | null;
};

export interface ScheduleEntryPrintable {
  dateUtc: Date;
  mealTiming: MealTiming | null;
  medicationName: string;
  dose: string;
  form: string;
}

const DEFAULT_UNITS = "unit";

export function toPrintableEntries(
  entries: ScheduleEntryWithRelations[],
): ScheduleEntryPrintable[] {
  const seen = new Set<string>();
  const uniqueEntries = entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });

  return uniqueEntries.map((entry) => {
    const dose =
      entry.medication?.dose !== null && entry.medication?.dose !== undefined
        ? `${entry.medication.dose}mg`
        : "";

    let form = "";
    if (
      entry.schedule?.quantity !== undefined &&
      entry.schedule?.quantity !== null &&
      entry.schedule?.units
    ) {
      form = `${entry.schedule.quantity} ${entry.schedule.units}`;
    }

    const medicationName = entry.medication?.name
      ? entry.medication.name
      : entry.medicationId
        ? `Medication ${entry.medicationId}`
        : "Unknown Medication";

    return {
      dateUtc: entry.dateTime,
      mealTiming: normalizeMealTiming(entry.schedule?.mealTiming),
      medicationName,
      dose,
      form,
    };
  });
}

function normalizeMealTiming(
  value: string | null | undefined,
): MealTiming | null {
  if (value === "before" || value === "with" || value === "after") {
    return value;
  }
  if (!value || value.trim() === "") {
    return null;
  }
  return "anytime";
}
