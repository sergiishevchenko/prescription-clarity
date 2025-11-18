import { useEffect } from "react";

import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { persistWizardFormState } from "@/lib/medicationWizardStorage";

type Params = {
  values: FormValues;
  timesOfDay: TimeOfDay[];
  days: string[];
};

export const useWizardFormPersistence = ({
  values,
  timesOfDay,
  days,
}: Params) => {
  useEffect(() => {
    const { photo, ...serializableValues } = values;
    void photo;
    persistWizardFormState({
      formValues: serializableValues,
      timesOfDay,
      days,
    });
  }, [values, timesOfDay, days]);
};
