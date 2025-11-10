"use client";

import { Input } from "@/components/ui/Input";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { FormValues } from "@/lib/medicationTypes";

export default function DatesAndDuration() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const startDate = useWatch({ control, name: "startDate" });
  const durationDays = useWatch({ control, name: "durationDays" });
  const ongoing = useWatch({ control, name: "ongoing" });

  useEffect(() => {
    if (ongoing) return;
    if (!startDate || !durationDays) return;
    const s = new Date(String(startDate) + "T00:00:00");
    if (Number.isNaN(s.getTime())) return;
    const e = new Date(s);
    e.setDate(s.getDate() + Number(durationDays) - 1);
    const endStr = e.toISOString().slice(0, 10);
    setValue("endDate", endStr, { shouldDirty: true });
  }, [startDate, durationDays, ongoing, setValue]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-base font-medium text-gray-900">
            Start Date
          </label>
          <div className="mt-2">
            <Input
              type="date"
              disabled={ongoing}
              {...register("startDate", { required: "Start date is required" })}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">Start date is required</p>
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-gray-900">
            End Date
          </label>
          <div className="mt-2">
            <Input
              type="date"
              disabled={ongoing}
              {...register("endDate", { required: "End date is required" })}
            />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">End date is required</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-base font-medium text-gray-900">
            Duration (days)
          </label>
          <div className="mt-2">
            <Input
              type="number"
              min={1}
              disabled={ongoing}
              {...register("durationDays", {
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
                required: "Duration is required",
              })}
            />
          </div>
          {errors.durationDays && (
            <p className="mt-1 text-sm text-red-600">
              {errors.durationDays.message as string}
            </p>
          )}
        </div>
      </div>

      <label className="mt-1 inline-flex items-center gap-3">
        <input type="checkbox" className="h-4 w-4" {...register("ongoing")} />
        <span className="text-sm text-gray-900">
          Ongoing medication (no end date)
        </span>
      </label>
    </>
  );
}
