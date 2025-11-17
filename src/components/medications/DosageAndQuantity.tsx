"use client";

import { Input } from "@/components/ui/Input";
import { FormLabel } from "@/components/ui/FormLabel";
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
        <FormLabel
          htmlFor="quantity"
          required
          tooltip={
            <>
              <p>
                How many <strong>pills</strong> or <strong>units</strong> you
                take at each dose.
              </p>
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  marginTop: "0.75rem",
                }}
              >
                Examples:
              </p>
              <ul>
                <li>1 tablet</li>
                <li>2 capsules</li>
                <li>5ml liquid</li>
              </ul>
            </>
          }
        >
          Quantity
        </FormLabel>
        <Input
          id="quantity"
          type="number"
          min={1}
          {...register("quantity", {
            valueAsNumber: true,
            required: "Quantity is required",
            min: { value: 1, message: "Must be at least 1" },
          })}
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">
            {errors.quantity.message as string}
          </p>
        )}
      </div>
      <div>
        <FormLabel
          htmlFor="dosage"
          required
          tooltip={
            <>
              <p>
                The amount of medication in each dose. Look for this on your
                prescription label.
              </p>
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                  marginTop: "0.75rem",
                }}
              >
                Examples:
              </p>
              <ul>
                <li>10mg (milligrams)</li>
                <li>500mg</li>
                <li>100mcg (micrograms)</li>
              </ul>
            </>
          }
        >
          Dosage (mg)
        </FormLabel>
        <Input
          id="dosage"
          type="number"
          min={1}
          {...register("dosageMg", {
            valueAsNumber: true,
            required: "Dosage is required",
            min: { value: 1, message: "Must be at least 1" },
          })}
        />
        {errors.dosageMg && (
          <p className="mt-1 text-sm text-red-600">
            {errors.dosageMg.message as string}
          </p>
        )}
      </div>
    </div>
  );
}
