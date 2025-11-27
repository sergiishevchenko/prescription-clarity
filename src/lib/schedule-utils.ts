// Client-safe utility functions for schedule entries
// This file can be imported in both server and client components

export function extractTimeFromLocalDateTime(localDateTime: string): string {
  // localDateTime format: "2025-11-18T08:00"
  const match = localDateTime.match(/T(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return "";
}

export function extractDateFromLocalDateTime(localDateTime: string): string {
  // localDateTime format: "2025-11-18T08:00"
  const match = localDateTime.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  return "";
}

export function formatDose(
  quantity: number | null,
  units: string | null,
): string {
  const effectiveQuantity = quantity ?? 1;
  const effectiveUnits = units || "mg";
  return `${effectiveQuantity} ${effectiveUnits}`;
}

export function formatDosage(dose: number | null | undefined): string {
  if (dose == null) {
    return "";
  }
  return `${dose} mg`;
}

export function mapMealTimingToContext(
  mealTiming: string | null,
  status: "PLANNED" | "DONE",
): "before" | "with" | "after" | "anytime" | "taken" {
  if (status === "DONE") {
    return "taken";
  }
  if (!mealTiming) {
    return "anytime";
  }
  return mealTiming as "before" | "with" | "after" | "anytime";
}

export async function updateScheduleEntryStatus(
  entryId: string,
  status: "PLANNED" | "DONE",
): Promise<{ id: string; status: "PLANNED" | "DONE" }> {
  const res = await fetch(`/api/schedule/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to update schedule entry");
  }

  return (await res.json()) as { id: string; status: "PLANNED" | "DONE" };
}
