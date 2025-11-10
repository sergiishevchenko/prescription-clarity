"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import DosageAndQuantity from "./DosageAndQuantity";
import TimeOfDayChips from "./TimeOfDayChips";
import TimeInputs from "./TimeInputs";
import DaysOfWeekSelector from "./DaysOfWeekSelector";
import DatesAndDuration from "./DatesAndDuration";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { DAY_LABELS } from "@/lib/medicationTypes";
import { useToast } from "@/components/shared/ToastProvider";

const PhotoUploader = dynamic(() => import("./PhotoUploader"), { ssr: false });

export default function NewMedicationForm() {
  const router = useRouter();
  const toast = useToast();
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>(["morning"]);
  const [timeError, setTimeError] = useState<string>("");
  const [days, setDays] = useState<string[]>([...DAY_LABELS]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDuration = 7;
  const defaultEnd = useMemo(() => {
    const start = new Date(todayStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + defaultDuration - 1);
    return end.toISOString().slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const methods = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      name: "",
      quantity: 1,
      dosageMg: 500,
      mealTiming: "before",
      frequency: 1,
      durationDays: defaultDuration,
      startDate: todayStr,
      endDate: defaultEnd,
      ongoing: false,
      morningTime: "07:30",
      afternoonTime: "12:30",
      eveningTime: "18:30",
    },
  });

  const { register, handleSubmit, control } = methods;
  const freq = useWatch({ control, name: "frequency" });

  useEffect(() => {
    const required = Number(freq || 1);
    if (timesOfDay.length < required) {
      setTimeError(
        required === 1
          ? "Please select a time of day."
          : required === 2
            ? "Please select a second time of day for your twice-daily medication."
            : "Please select all three times of day for your medication.",
      );
    } else if (timesOfDay.length > required) {
      const order: TimeOfDay[] = ["morning", "afternoon", "evening"];
      setTimesOfDay((prev) =>
        order.filter((t) => prev.includes(t)).slice(0, required),
      );
      setTimeError("");
    } else {
      setTimeError("");
    }
  }, [freq, timesOfDay]);

  function toggleTime(slot: TimeOfDay) {
    setTimeError("");
    setTimesOfDay((prev) => {
      const maxNum = Number(freq || 1) || 1;
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      }
      if (prev.length < maxNum) return [...prev, slot];
      const kept = prev.slice(-(maxNum - 1));
      return [...kept, slot];
    });
  }

  function toggleDay(label: string) {
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  }

  const onSubmit = async (data: FormValues) => {
    const expected = Number(data.frequency);
    if (timesOfDay.length !== expected) {
      setTimeError(
        expected === 1
          ? "Please select a time of day."
          : expected === 2
            ? "Please select two times of day for your twice-daily medication."
            : "Please select three times of day for your medication.",
      );
      return;
    }

    // Map form fields to API shape
    const dose = `${Number(data.quantity)} x ${Number(data.dosageMg)} mg (${data.mealTiming})`;
    const start = data.startDate;
    // Ensure endDate exists: if ongoing or empty, synthesize from duration
    const duration = Number(data.durationDays || 30);
    let end = data.endDate;
    if (!end || data.ongoing) {
      const s = new Date(start + "T00:00:00");
      const e = new Date(s);
      e.setDate(s.getDate() + duration - 1);
      end = e.toISOString().slice(0, 10);
    }

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          dose,
          frequency: Number(data.frequency),
          startDate: new Date(start + "T00:00:00.000Z").toISOString(),
          endDate: new Date(end + "T00:00:00.000Z").toISOString(),
        }),
      });
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        console.error("Create medication failed", await res.text());
        toast("Failed to save medication", { variant: "error" });
        return;
      }
      toast("Medication saved", { variant: "success" });
      router.push("/dashboard/medications");
      router.refresh();
    } catch {
      toast("Network error", { variant: "error" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white px-6 py-8 shadow">
          <h1 className="text-2xl font-semibold text-gray-900">
            Add Medication
          </h1>

          <FormProvider {...methods}>
            <form
              className="mt-6 space-y-6"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div>
                <label className="block text-base font-medium text-gray-900">
                  Medication Name
                </label>
                <div className="mt-2">
                  <Input
                    placeholder="e.g., Aspirin"
                    {...register("name", {
                      required: "Medication name is required",
                    })}
                  />
                </div>
                {methods.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {methods.formState.errors.name.message}
                  </p>
                )}
              </div>

              <DosageAndQuantity />

              <div>
                <label className="block text-base font-medium text-gray-900">
                  Meal Timing
                </label>
                <div className="mt-2">
                  <select
                    className="block w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                    {...register("mealTiming")}
                  >
                    <option value="before">Before Meal</option>
                    <option value="with">With Meal</option>
                    <option value="after">After Meal</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-900">
                  Times Per Day
                </label>
                <div className="mt-2">
                  <select
                    className="block w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                    {...register("frequency", { valueAsNumber: true })}
                  >
                    <option value={1}>Once daily</option>
                    <option value={2}>Twice daily</option>
                    <option value={3}>Three times daily</option>
                  </select>
                </div>
              </div>

              <TimeOfDayChips
                selected={timesOfDay}
                onToggle={toggleTime}
                error={timeError}
              />

              <TimeInputs selected={timesOfDay} />

              <DaysOfWeekSelector selected={days} onToggle={toggleDay} />

              <DatesAndDuration />

              <PhotoUploader />

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
                >
                  {methods.formState.isSubmitting
                    ? "Adding..."
                    : "Add Prescription"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
