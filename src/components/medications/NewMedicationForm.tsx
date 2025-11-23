"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/shared/ToastProvider";
import { DosingScheduleStep } from "./wizard/components/DosingScheduleStep";
import { ReviewStep } from "./wizard/components/ReviewStep";
import { TreatmentDurationStep } from "./wizard/components/TreatmentDurationStep";
import { WeeklyFrequencyStep } from "./wizard/components/WeeklyFrequencyStep";
import { useFractionalQuantity } from "./wizard/hooks/useFractionalQuantity";
import { useTimeOfDaySelections } from "./wizard/hooks/useTimeOfDaySelections";
import { useWizardFormPersistence } from "./wizard/hooks/useWizardFormPersistence";
import {
  MIN_NAME_LENGTH_FOR_LIBRARY,
  WIZARD_RESET_EVENT,
} from "./wizard/constants";
import { mapFormToSchedulePayload } from "./wizard/utils/schedule";
import { normalizeTimeValue, sanitizeCustomTimes } from "./wizard/utils/time";
import type {
  FormValues,
  MedicationForm,
  TimeOfDay,
} from "@/lib/medicationTypes";
import { DAY_LABELS, getMedicationFormLabel } from "@/lib/medicationTypes";
import {
  clearWizardStorage,
  readWizardFormState,
  type StoredWizardFormState,
} from "@/lib/medicationWizardStorage";
import stepStyles from "./MedicationWizardStep1.module.css";

export type StepValidatorFn = (() => Promise<boolean>) & {
  lastErrorMessage?: string;
};

type NewMedicationFormProps = {
  step: number;
  stepOneComponent: ReactNode;
  onValidate?: (isValid: boolean) => void;
  validateStepRef?: React.MutableRefObject<StepValidatorFn | null>;
  ensureMedicationRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
  submitFormRef?: React.MutableRefObject<(() => Promise<void> | void) | null>;
  onSubmittingChange?: (submitting: boolean) => void;
};

type MedicationSearchHit = {
  id: string;
  name: string;
  dose?: number | null;
  form?: string | null;
};

export default function NewMedicationForm({
  step,
  stepOneComponent,
  onValidate,
  validateStepRef,
  ensureMedicationRef,
  submitFormRef,
  onSubmittingChange,
}: NewMedicationFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [persistedState] = useState<StoredWizardFormState | null>(() =>
    readWizardFormState(),
  );
  const [days, setDays] = useState<string[]>(() =>
    persistedState?.days && persistedState.days.length > 0
      ? [...persistedState.days]
      : [...DAY_LABELS],
  );
  const isSubmittingRef = useRef(false);
  const ensuringMedicationRef = useRef(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultDuration = 7;

  const defaultEnd = useMemo(() => {
    const start = new Date(todayStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + defaultDuration - 1);
    return end.toISOString().slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseDefaultValues = useMemo<FormValues>(
    () => ({
      medicationId: undefined,
      name: "",
      quantity: undefined,
      dosageMg: undefined,
      form: undefined,
      mealTiming: "before",
      frequency: 1,
      durationDays: defaultDuration,
      startDate: todayStr,
      endDate: defaultEnd,
      ongoing: false,
      morningTime: "07:30",
      afternoonTime: "12:30",
      eveningTime: "18:30",
      customTimes: [],
    }),
    [defaultEnd, defaultDuration, todayStr],
  );

  const initialValues = useMemo<FormValues>(
    () => ({
      ...baseDefaultValues,
      ...(persistedState?.formValues ?? {}),
    }),
    [baseDefaultValues, persistedState],
  );

  const methods = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: initialValues,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = methods;

  const freq = useWatch({ control, name: "frequency" });
  const mealTiming = useWatch({ control, name: "mealTiming" });
  const rawQuantity = useWatch({ control, name: "quantity" });
  const allValues = methods.watch();
  const customTimes = useMemo(
    () => sanitizeCustomTimes(allValues.customTimes),
    [allValues.customTimes],
  );

  const initialTimes = useMemo<TimeOfDay[]>(
    () => (persistedState?.timesOfDay ? [...persistedState.timesOfDay] : []),
    [persistedState],
  );

  const {
    timesOfDay,
    timeError,
    toggleTime,
    resetTimes: resetPresetTimes,
  } = useTimeOfDaySelections({
    initialSlots: initialTimes,
    frequency: Number(freq) || 1,
    customTimesCount: customTimes.length,
  });

  useWizardFormPersistence({ values: allValues, timesOfDay, days });

  const {
    quantityWholeInputValue,
    quantityFraction,
    handleWholeQuantityChange,
    handleFractionQuantityChange,
  } = useFractionalQuantity({ rawQuantity, setValue });

  const quantityFieldRegister = register("quantity", {
    valueAsNumber: true,
    min: { value: 0, message: "Must be at least 0" },
    max: { value: 1000, message: "Must be 1000 or less" },
    validate: (value) =>
      Number(value) > 0 || "Please enter the quantity or fractional amount.",
  });

  const frequencyFieldRegister = register("frequency", { valueAsNumber: true });
  const mealTimingFieldRegister = register("mealTiming");

  const handleUnitsChange = useCallback(
    (value: MedicationForm | undefined) => {
      setValue("form", value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleFrequencyChange = useCallback(
    (value: number) => {
      setValue("frequency", value);
    },
    [setValue],
  );

  const handleMealTimingChange = useCallback(
    (value: FormValues["mealTiming"]) => {
      setValue("mealTiming", value);
    },
    [setValue],
  );

  const scrollToQuantityInputs = useCallback(() => {
    if (typeof document === "undefined") return;
    const quantityInput = document.getElementById("quantity-whole");
    if (quantityInput instanceof HTMLInputElement) {
      quantityInput.scrollIntoView({ behavior: "smooth", block: "center" });
      quantityInput.focus({ preventScroll: true });
      return;
    }
    const fractionSelect = document.getElementById("quantity-fraction");
    if (fractionSelect instanceof HTMLElement) {
      fractionSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      fractionSelect.focus({ preventScroll: true });
    }
  }, []);

  const scrollToNameInput = useCallback(() => {
    if (typeof document === "undefined") return;
    const nameInput = document.getElementById("medication-name");
    if (nameInput instanceof HTMLInputElement) {
      nameInput.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInput.focus({ preventScroll: true });
    }
  }, []);

  // NEW: плавний скрол до Units
  const scrollToUnitsField = useCallback(() => {
    if (typeof document === "undefined") return;
    const unitsSelect = document.getElementById("medication-units");
    if (unitsSelect instanceof HTMLElement) {
      unitsSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      unitsSelect.focus?.({ preventScroll: true });
    }
  }, []);

  const medicationSummary = useMemo(() => {
    const name = (allValues.name || "").trim();
    if (!name || step === 1 || step === 5) return null;
    const formLabel = getMedicationFormLabel(allValues.form);
    const summaryTitle = formLabel ? `${name} - ${formLabel}` : name;
    const dosage = Number(allValues.dosageMg);
    const showDosage = Number.isFinite(dosage) && dosage > 0;
    return (
      <div className={stepStyles.medicationSummary}>
        <div>
          <p className={stepStyles.summaryLabel}>You are scheduling</p>
          <p className={stepStyles.summaryName}>{summaryTitle}</p>
        </div>
        {showDosage ? (
          <span className={stepStyles.summaryBadge}>{dosage} mg</span>
        ) : null}
      </div>
    );
  }, [allValues.dosageMg, allValues.form, allValues.name, step]);

  const resetWizardState = useCallback(() => {
    clearWizardStorage();
    reset(baseDefaultValues);
    setDays([...DAY_LABELS]);
    resetPresetTimes([]);
  }, [baseDefaultValues, reset, resetPresetTimes]);

  const validateCurrentStep = useCallback<StepValidatorFn>(async () => {
    const validator = validateCurrentStep as StepValidatorFn;
    validator.lastErrorMessage = undefined;

    if (step === 1) {
      const nameValue = (allValues.name || "").trim();
      if (!nameValue) {
        validator.lastErrorMessage = "Please fill in the medication name";
        setError("name", {
          type: "manual",
          message: "Please fill in the medication name",
        });
        scrollToNameInput();
        return false;
      }
      clearErrors("name");

      const dosageValid = await trigger("dosageMg");
      if (!dosageValid) {
        validator.lastErrorMessage =
          "Please enter a valid dosage (1 mg or more) or leave the field empty.";
        return false;
      }

      return true;
    }

    if (step === 2) {
      // 1) Quantity / fraction (top of the form)
      const quantityValidSecond = await trigger("quantity");
      if (!quantityValidSecond) {
        validator.lastErrorMessage =
          "Enter the dose amount (quantity or fraction) before continuing.";
        scrollToQuantityInputs();
        return false;
      }

      const expected = Number(allValues.frequency || 1) || 1;
      const customCount = customTimes.length;
      const presetCount = timesOfDay.length;
      const totalSelected = presetCount + customCount;

      // 2) Units selector
      if (!allValues.form) {
        validator.lastErrorMessage =
          "Please select a unit for this medication.";
        setError("form", {
          type: "manual",
          message: "Please select a unit for this medication.",
        });
        scrollToUnitsField();
        return false;
      }
      clearErrors("form");

      // 3) Times of day (preset + custom)
      if (timeError) {
        validator.lastErrorMessage =
          timeError || "Please complete the dosing schedule.";
        return false;
      }

      if (totalSelected === 0 || totalSelected < expected) {
        validator.lastErrorMessage = "Please complete the dosing schedule.";
        return false;
      }

      if (!customTimes.every((time) => normalizeTimeValue(time))) {
        validator.lastErrorMessage =
          "Please provide a valid time for each custom reminder.";
        return false;
      }

      const quantityValid = await trigger("quantity");
      if (!quantityValid) {
        validator.lastErrorMessage =
          "Enter the dose amount (quantity or fraction) before continuing.";
        scrollToQuantityInputs();
        return false;
      }

      // NEW: валідація Units (form)
      if (!allValues.form) {
        validator.lastErrorMessage =
          "Please select a unit for this medication.";
        setError("form", {
          type: "manual",
          message: "Please select a unit for this medication.",
        });
        scrollToUnitsField();
        return false;
      }
      clearErrors("form");

      return true;
    }

    if (step === 3) {
      return days.length > 0;
    }

    if (step === 4) {
      if (allValues.ongoing) return true;
      const startValid = await trigger("startDate");
      const endValid = await trigger("endDate");
      const durationValid = await trigger("durationDays");
      const startValue = (allValues.startDate || "").trim();
      const endValue = (allValues.endDate || "").trim();
      const durationValue = Number(allValues.durationDays || 0);
      return (
        startValid &&
        endValid &&
        durationValid &&
        startValue.length > 0 &&
        endValue.length > 0 &&
        durationValue >= 1
      );
    }

    return true;
  }, [
    allValues.durationDays,
    allValues.endDate,
    allValues.form,
    allValues.frequency,
    allValues.name,
    allValues.ongoing,
    allValues.startDate,
    clearErrors,
    customTimes,
    days.length,
    scrollToNameInput,
    scrollToQuantityInputs,
    scrollToUnitsField,
    setError,
    step,
    timeError,
    timesOfDay.length,
    trigger,
  ]);

  useEffect(() => {
    if (!onValidate) return;
    if (step === 1) {
      const nameValue = (allValues.name || "").trim();
      onValidate(Boolean(nameValue));
      return;
    }
    // For steps 2+, rely on explicit validation via validateStepRef
    // (triggered from the "Next" button) to avoid scrolling and
    // error highlighting while the user is still filling the form.
    onValidate(true);
  }, [allValues.name, onValidate, step]);

  useEffect(() => {
    if (!validateStepRef) return;
    validateStepRef.current = validateCurrentStep;
    return () => {
      if (validateStepRef.current === validateCurrentStep) {
        validateStepRef.current = null;
      }
    };
  }, [validateCurrentStep, validateStepRef]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleReset = () => {
      resetWizardState();
    };
    window.addEventListener(WIZARD_RESET_EVENT, handleReset);
    return () => {
      window.removeEventListener(WIZARD_RESET_EVENT, handleReset);
    };
  }, [resetWizardState]);

  const ensureMedicationRecord = useCallback(async () => {
    const trimmedName = (allValues.name || "").trim();
    if (
      trimmedName.length < MIN_NAME_LENGTH_FOR_LIBRARY ||
      allValues.medicationId ||
      ensuringMedicationRef.current
    ) {
      return true;
    }

    ensuringMedicationRef.current = true;
    const normalizedName = trimmedName.toLowerCase();

    const numericDose = Number(allValues.dosageMg);
    const desiredDose =
      Number.isFinite(numericDose) && numericDose > 0
        ? Math.round(numericDose)
        : undefined;
    const desiredForm = allValues.form
      ? allValues.form.toLowerCase()
      : undefined;

    const findExisting = async () => {
      try {
        const response = await fetch("/api/medications/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName }),
        });
        if (!response.ok) {
          return null;
        }
        const data = (await response.json()) as {
          medications?: MedicationSearchHit[];
        };
        return (
          data.medications?.find((hit) => {
            if (hit.name.trim().toLowerCase() !== normalizedName) {
              return false;
            }

            const hitDose = typeof hit.dose === "number" ? hit.dose : undefined;
            const hitForm = hit.form ? hit.form.toLowerCase() : undefined;

            const doseMatches =
              desiredDose === undefined ||
              hitDose === undefined ||
              hitDose === desiredDose;

            const formMatches =
              !desiredForm || !hitForm || hitForm === desiredForm;

            return doseMatches && formMatches;
          }) ?? null
        );
      } catch {
        return null;
      }
    };

    try {
      const existing = await findExisting();
      if (existing?.id) {
        setValue("medicationId", existing.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return true;
      }

      const payload: {
        name: string;
        dose?: number;
        form?: MedicationForm;
      } = {
        name: trimmedName,
      };

      if (desiredDose !== undefined) {
        payload.dose = desiredDose;
      }
      if (allValues.form) {
        payload.form = allValues.form;
      }

      const response = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        toast("Failed to save medication name", { variant: "error" });
        return false;
      }
      const data = (await response.json()) as {
        medication?: { id: string };
      };
      if (data.medication?.id) {
        setValue("medicationId", data.medication.id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      toast("Medication added to your library", { variant: "success" });
      return true;
    } catch {
      toast("Failed to save medication name", { variant: "error" });
      return false;
    } finally {
      ensuringMedicationRef.current = false;
    }
  }, [
    allValues.dosageMg,
    allValues.form,
    allValues.medicationId,
    allValues.name,
    setValue,
    toast,
  ]);

  useEffect(() => {
    if (!ensureMedicationRef) return;
    ensureMedicationRef.current = ensureMedicationRecord;
    return () => {
      if (ensureMedicationRef.current === ensureMedicationRecord) {
        ensureMedicationRef.current = null;
      }
    };
  }, [ensureMedicationRecord, ensureMedicationRef]);

  const toggleDay = (label: string) => {
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const applyDayPreset = (labels: readonly string[]) => {
    setDays(Array.from(labels));
  };

  const submitSchedule = useCallback(async () => {
    if (step !== 5 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onSubmittingChange?.(true);
    const runner = handleSubmit(async (data) => {
      const customSelections = sanitizeCustomTimes(data.customTimes);
      if (timesOfDay.length === 0 && customSelections.length === 0) {
        toast("Please select at least one time of day", {
          variant: "error",
        });
        return;
      }
      if (customSelections.length > 6) {
        toast("You can add up to 6 custom reminders per day", {
          variant: "error",
        });
        return;
      }
      if (!data.medicationId) {
        toast("Please add the medication on step 1 first", {
          variant: "error",
        });
        return;
      }
      if ((data.customTimes?.length ?? 0) !== customSelections.length) {
        toast("Please provide a valid time for each custom reminder", {
          variant: "error",
        });
        return;
      }
      try {
        const payload = mapFormToSchedulePayload(data, timesOfDay, days);
        if (payload.frequencyDays.length === 0) {
          toast("Please select at least one day", { variant: "error" });
          return;
        }
        if (payload.timeOfDay.length === 0) {
          toast("Please select at least one time of day", {
            variant: "error",
          });
          return;
        }
        const response = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast("Failed to create schedule", { variant: "error" });
          return;
        }
        const responseData = (await response.json()) as {
          schedule?: { id: string };
        };
        if (responseData.schedule?.id) {
          try {
            await fetch("/api/schedule/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduleId: responseData.schedule.id }),
            });
          } catch (error) {
            console.error("Schedule generation failed", error);
          }
        }
        toast("Schedule added", { variant: "success" });
        resetWizardState();
        router.push("/schedule");
      } catch {
        toast("Network error", { variant: "error" });
      }
    });
    try {
      await runner();
    } finally {
      isSubmittingRef.current = false;
      onSubmittingChange?.(false);
    }
  }, [
    days,
    handleSubmit,
    onSubmittingChange,
    resetWizardState,
    router,
    step,
    timesOfDay,
    toast,
  ]);

  useEffect(() => {
    if (!submitFormRef) return;
    submitFormRef.current = submitSchedule;
    return () => {
      if (submitFormRef.current === submitSchedule) {
        submitFormRef.current = null;
      }
    };
  }, [submitFormRef, submitSchedule]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 5) {
      void submitSchedule();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        id="new-medication-form"
        onSubmit={handleFormSubmit}
        noValidate
        className="space-y-8"
      >
        {step === 1 && stepOneComponent}

        {step === 2 && (
          <DosingScheduleStep
            medicationSummary={medicationSummary}
            quantityFieldRegister={quantityFieldRegister}
            quantityError={errors.quantity?.message as string | undefined}
            quantityWholeValue={quantityWholeInputValue}
            quantityFractionValue={quantityFraction}
            onWholeQuantityChange={handleWholeQuantityChange}
            onFractionQuantityChange={handleFractionQuantityChange}
            unitsValue={allValues.form}
            onUnitsChange={handleUnitsChange}
            frequencyValue={Number(freq) || 1}
            frequencyFieldRegister={frequencyFieldRegister}
            onFrequencyChange={handleFrequencyChange}
            mealTimingValue={mealTiming ?? "before"}
            mealTimingFieldRegister={mealTimingFieldRegister}
            onMealTimingChange={handleMealTimingChange}
            timesOfDay={timesOfDay}
            timeError={timeError}
            onToggleTime={toggleTime}
          />
        )}

        {step === 3 && (
          <WeeklyFrequencyStep
            medicationSummary={medicationSummary}
            selectedDays={days}
            onToggleDay={toggleDay}
            onApplyPreset={applyDayPreset}
          />
        )}

        {step === 4 && (
          <TreatmentDurationStep medicationSummary={medicationSummary} />
        )}

        {step === 5 && (
          <section className={stepStyles.step}>
            <div className={stepStyles.surface}>
              <ReviewStep
                values={allValues}
                timesOfDay={timesOfDay}
                customTimes={customTimes}
                days={days}
              />
            </div>
          </section>
        )}
      </form>
    </FormProvider>
  );
}
