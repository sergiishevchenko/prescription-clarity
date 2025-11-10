"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/shared/ToastProvider";

type Medication = {
  id: string;
  name: string;
  dose: string;
  frequency: number;
  startDate: string; // ISO
  endDate: string; // ISO
};

type FormShape = {
  name: string;
  dose: string;
  frequency: number;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
};

function toDateOnly(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function EditMedicationForm({
  medication,
}: {
  medication: Medication;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormShape>({
    mode: "onBlur",
    defaultValues: {
      name: medication.name,
      dose: medication.dose,
      frequency: medication.frequency,
      startDate: toDateOnly(medication.startDate),
      endDate: toDateOnly(medication.endDate),
    },
  });

  async function onSubmit(values: FormShape) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const body = {
      name: values.name.trim(),
      dose: values.dose.trim(),
      frequency: Number(values.frequency),
      startDate: values.startDate
        ? new Date(values.startDate + "T00:00:00.000Z").toISOString()
        : undefined,
      endDate: values.endDate
        ? new Date(values.endDate + "T00:00:00.000Z").toISOString()
        : undefined,
    };
    try {
      const res = await fetch(`/api/medications/${medication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(data?.error || "Failed to update");
      }
      setSuccess("Medication updated");
      toast("Medication updated", { variant: "success" });
      router.push("/dashboard/medications");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white px-6 py-8 shadow">
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Medication
          </h1>
          <form
            className="mt-6 space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <label className="block text-base font-medium text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <Input
                  {...register("name", { required: "Name is required" })}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">Name is required</p>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-900">
                Dose
              </label>
              <div className="mt-2">
                <Input
                  placeholder="e.g., 500 mg"
                  {...register("dose", { required: "Dose is required" })}
                />
              </div>
              {errors.dose && (
                <p className="mt-1 text-sm text-red-600">Dose is required</p>
              )}
            </div>
            <div>
              <label className="block text-base font-medium text-gray-900">
                Frequency (per day)
              </label>
              <div className="mt-2">
                <Input
                  type="number"
                  min={1}
                  max={24}
                  {...register("frequency", {
                    valueAsNumber: true,
                    required: "Frequency is required",
                    min: { value: 1, message: "Must be at least 1" },
                  })}
                />
              </div>
              {errors.frequency && (
                <p className="mt-1 text-sm text-red-600">
                  {(errors.frequency.message as string) ||
                    "Frequency is required"}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-base font-medium text-gray-900">
                  Start Date
                </label>
                <div className="mt-2">
                  <Input
                    type="date"
                    {...register("startDate", {
                      required: "Start date is required",
                    })}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    Start date is required
                  </p>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-900">
                  End Date
                </label>
                <div className="mt-2">
                  <Input
                    type="date"
                    {...register("endDate", {
                      required: "End date is required",
                    })}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    End date is required
                  </p>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
