"use client";

import { Input } from "@/components/ui/Input";
import { useFormContext } from "react-hook-form";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";

type Props = {
  selected: TimeOfDay[];
};

export default function TimeInputs({ selected }: Props) {
  const { register } = useFormContext<FormValues>();

  return (
    <>
      {selected.includes("morning") && (
        <div>
          <label className="block text-base font-medium text-gray-900">
            Morning Time
          </label>
          <div className="mt-2">
            <Input type="time" step={60} {...register("morningTime")} />
          </div>
        </div>
      )}
      {selected.includes("afternoon") && (
        <div>
          <label className="block text-base font-medium text-gray-900">
            Afternoon Time
          </label>
          <div className="mt-2">
            <Input type="time" step={60} {...register("afternoonTime")} />
          </div>
        </div>
      )}
      {selected.includes("evening") && (
        <div>
          <label className="block text-base font-medium text-gray-900">
            Evening Time
          </label>
          <div className="mt-2">
            <Input type="time" step={60} {...register("eveningTime")} />
          </div>
        </div>
      )}
    </>
  );
}
