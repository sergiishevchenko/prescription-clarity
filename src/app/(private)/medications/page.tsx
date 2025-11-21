import { cookies } from "next/headers";
import Link from "next/link";

import MedicationsTable from "@/components/medications/MedicationsTable";
import { absoluteUrl } from "@/lib/url";

type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: number;
  startDate: string;
  endDate: string;
};

async function getMedications(): Promise<Medication[]> {
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

  const data = (await res.json()) as { medications: Medication[] };
  return data.medications;
}

export default async function MedicationsListPage() {
  const medications = await getMedications();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Medications
          </h1>
          <Link
            href="/medications/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add
          </Link>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <MedicationsTable initial={medications} />
        </div>
      </div>
    </div>
  );
}
