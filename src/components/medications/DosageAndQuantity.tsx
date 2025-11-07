"use client";

import { Input } from "@/components/ui/Input";
import { useFormContext } from "react-hook-form";
import type { FormValues } from "@/lib/medicationTypes";

export default function DosageAndQuantity() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-base font-medium text-gray-900">Quantity</label>
        <div className="mt-2">
          <Input
            type="number"
            min={1}
            {...register("quantity", {
              valueAsNumber: true,
              required: true,
              min: { value: 1, message: "Must be at least 1" },
            })}
          />
        </div>
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message as string}</p>
        )}
      </div>
      <div>
        <label className="block text-base font-medium text-gray-900">Dosage (mg)</label>
        <div className="mt-2">
          <Input
            type="number"
            min={1}
            {...register("dosageMg", {
              valueAsNumber: true,
              required: true,
              min: { value: 1, message: "Must be at least 1" },
            })}
          />
        </div>
        {errors.dosageMg && (
          <p className="mt-1 text-sm text-red-600">{errors.dosageMg.message as string}</p>
        )}
      </div>
    </div>
  );
}

