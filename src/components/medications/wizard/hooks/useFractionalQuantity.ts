import { useCallback } from "react";
import type { UseFormSetValue } from "react-hook-form";

import type { FormValues } from "@/lib/medicationTypes";

const clampWholeQuantity = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1000, Math.max(0, Math.floor(value)));
};

const getFractionFromQuantity = (value: number) => {
  const fraction = value - Math.trunc(value);
  if (fraction >= 0.74 && fraction <= 0.76) return 0.75;
  if (fraction >= 0.49 && fraction <= 0.51) return 0.5;
  if (fraction >= 0.24 && fraction <= 0.26) return 0.25;
  return 0;
};

type Params = {
  rawQuantity: FormValues["quantity"];
  setValue: UseFormSetValue<FormValues>;
};

export const useFractionalQuantity = ({ rawQuantity, setValue }: Params) => {
  const numericValue = Number(rawQuantity ?? 0);
  const quantityWhole =
    rawQuantity === undefined || rawQuantity === null
      ? 0
      : clampWholeQuantity(numericValue);
  const quantityFraction =
    rawQuantity === undefined || rawQuantity === null
      ? 0
      : getFractionFromQuantity(numericValue);
  const quantityWholeInputValue: number | "" =
    rawQuantity === undefined || rawQuantity === null ? "" : quantityWhole;

  const handleWholeQuantityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextWhole = clampWholeQuantity(Number(event.target.value));
      setValue("quantity", nextWhole + quantityFraction, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [quantityFraction, setValue],
  );

  const handleFractionQuantityChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const fractionValue = Number(event.target.value) || 0;
      setValue("quantity", quantityWhole + fractionValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [quantityWhole, setValue],
  );

  return {
    quantityWholeInputValue,
    quantityFraction,
    handleWholeQuantityChange,
    handleFractionQuantityChange,
  };
};
