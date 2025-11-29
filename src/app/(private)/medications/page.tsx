import { cookies } from "next/headers";

import MedicationsOverview from "@/components/medications/MedicationsOverview";
import { absoluteUrl } from "@/lib/url";
import type { MedicationListItem } from "@/lib/medicationsListTypes";
import styles from "@/components/medications/medications.module.css";

async function getMedications(): Promise<MedicationListItem[]> {
  const store = await cookies();

  const cookieHeader = store
    .getAll()
    .map((c: { name: string; value: string }) => {
      return `${c.name}=${encodeURIComponent(c.value)}`;
    })
    .join("; ");

  const res = await fetch(absoluteUrl("/api/medications"), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load medications");
  }

  const data = (await res.json()) as { medications: MedicationListItem[] };
  return data.medications;
}

export default async function MedicationsListPage() {
  const medications = await getMedications();

  return (
    <div className={styles.page}>
      <MedicationsOverview initial={medications} />
    </div>
  );
}
