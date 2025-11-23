import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/url";
import EditMedicationDetailsForm from "@/components/medications/EditMedicationDetailsForm";

type Medication = {
  id: string;
  name: string;
  dose: number | null;
  form: string | null;
};

async function getMedication(id: string): Promise<Medication> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
  const res = await fetch(absoluteUrl(`/api/medications/${id}`), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) redirect("/login");
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Failed to load medication");
  const data = (await res.json()) as { medication: Medication };
  return data.medication;
}

export default async function EditMedicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const medication = await getMedication(id);
  return <EditMedicationDetailsForm medication={medication} />;
}
