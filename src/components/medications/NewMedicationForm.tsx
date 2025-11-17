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
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import TimeOfDayChips from "./TimeOfDayChips";
import TimeInputs from "./TimeInputs";
import DaysOfWeekSelector from "./DaysOfWeekSelector";
import DatesAndDuration from "./DatesAndDuration";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { DAY_LABELS } from "@/lib/medicationTypes";
import {
  clearWizardStorage,
  persistWizardFormState,
  readWizardFormState,
  type StoredWizardFormState,
} from "@/lib/medicationWizardStorage";
import stepStyles from "./MedicationWizardStep1.module.css";

type NewMedicationFormProps = {
  step: number;
  stepOneComponent: ReactNode;
  onValidate?: (isValid: boolean) => void;
  validateStepRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
  submitFormRef?: React.MutableRefObject<(() => Promise<void> | void) | null>;
  onSubmittingChange?: (submitting: boolean) => void;
};

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const MEAL_LABELS: Record<FormValues["mealTiming"], string> = {
  before: "Take before meal",
  with: "Take with meal",
  after: "Take after meal",
  anytime: "Take anytime",
};

const FREQUENCY_OPTIONS = [
  { value: 1, label: "1x", description: "Once" },
  { value: 2, label: "2x", description: "Twice" },
  { value: 3, label: "3x", description: "Three times" },
] as const;

const MEAL_TIMING_OPTIONS: Array<{
  value: FormValues["mealTiming"];
  label: string;
  description: string;
}> = [
  { value: "before", label: "Before Meal", description: "30 min before" },
  { value: "with", label: "With Meal", description: "During meal" },
  { value: "after", label: "After Meal", description: "30 min after" },
  { value: "anytime", label: "Anytime", description: "No restriction" },
];

const toIsoDate = (value: string, endOfDay = false) => {
  const base = new Date(`${value}T00:00:00`);
  if (Number.isNaN(base.getTime())) return new Date().toISOString();
  if (endOfDay) {
    base.setHours(23, 59, 59, 999);
  }
  return base.toISOString();
};

const toFrequencyHours = (timesPerDay?: number) => {
  const occurrences = Math.max(1, Number(timesPerDay) || 1);
  return Math.max(1, Math.round(24 / occurrences));
};

const mapFormToApiPayload = (values: FormValues) => ({
  name: values.name.trim(),
  dose: `${values.dosageMg} mg`,
  units: values.unit,
  frequency: toFrequencyHours(values.frequency),
  startDate: toIsoDate(values.startDate),
  endDate: toIsoDate(values.endDate, true),
});

const formatTimeValue = (value?: string) => {
  if (!value) return "Set a time";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes);
  return Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatDateLabel = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export default function NewMedicationForm({
  step,
  stepOneComponent,
  onValidate,
  validateStepRef,
  submitFormRef,
  onSubmittingChange,
}: NewMedicationFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [persistedState] = useState<StoredWizardFormState | null>(() =>
    readWizardFormState(),
  );
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>(() =>
    persistedState?.timesOfDay ? [...persistedState.timesOfDay] : [],
  );
  const [timeError, setTimeError] = useState<string>("");
  const [days, setDays] = useState<string[]>(() =>
    persistedState?.days && persistedState.days.length > 0
      ? [...persistedState.days]
      : [...DAY_LABELS],
  );
  const isSubmittingRef = useRef(false);

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
      name: "",
      quantity: 1,
      dosageMg: 500,
      unit: "tablets",
      mealTiming: "before",
      frequency: 1,
      durationDays: defaultDuration,
      startDate: todayStr,
      endDate: defaultEnd,
      ongoing: false,
      morningTime: "07:30",
      afternoonTime: "12:30",
      eveningTime: "18:30",
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

  const { register, handleSubmit, control, setValue, trigger } = methods;
  const freq = useWatch({ control, name: "frequency" });
  const mealTiming = useWatch({ control, name: "mealTiming" });
  const allValues = methods.watch();

  useEffect(() => {
    const { photo, ...serializableValues } = allValues;
    void photo;
    persistWizardFormState({
      formValues: serializableValues,
      timesOfDay,
      days,
    });
  }, [allValues, timesOfDay, days]);

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

  const validateCurrentStep = useCallback(async () => {
    if (step === 1) {
      const nameValid = await trigger("name");
      const quantityValid = await trigger("quantity");
      const dosageValid = await trigger("dosageMg");
      const unitValid = await trigger("unit");
      const nameValue = (allValues.name || "").trim();
      const quantityValue = allValues.quantity ?? 0;
      const dosageValue = allValues.dosageMg ?? 0;
      const unitValue = (allValues.unit || "").trim();
      return (
        nameValid &&
        quantityValid &&
        dosageValid &&
        unitValid &&
        nameValue.length > 0 &&
        quantityValue >= 1 &&
        dosageValue >= 1 &&
        unitValue.length > 0
      );
    }
    if (step === 2) {
      const expected = Number(allValues.frequency || 1);
      return expected > 0 && timesOfDay.length === expected && !timeError;
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
    // step 5 is review
    return true;
  }, [
    allValues.dosageMg,
    allValues.durationDays,
    allValues.endDate,
    allValues.frequency,
    allValues.name,
    allValues.ongoing,
    allValues.quantity,
    allValues.startDate,
    allValues.unit,
    step,
    timeError,
    timesOfDay,
    days.length,
    trigger,
  ]);

  useEffect(() => {
    if (onValidate) {
      validateCurrentStep().then(onValidate);
    }
  }, [onValidate, step, validateCurrentStep]);

  useEffect(() => {
    if (validateStepRef) {
      validateStepRef.current = validateCurrentStep;
    }
  }, [validateCurrentStep, validateStepRef]);

  const toggleTime = (slot: TimeOfDay) => {
    setTimeError("");
    setTimesOfDay((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((t) => t !== slot);
      }
      const required = Number(freq || 1) || 1;
      if (prev.length >= required) {
        return [...prev.slice(1), slot];
      }
      return [...prev, slot];
    });
  };

  const toggleDay = (label: string) => {
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const applyDayPreset = (labels: readonly string[]) => {
    setDays(Array.from(labels));
  };

  const submitMedication = useCallback(async () => {
    if (step !== 5 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    onSubmittingChange?.(true);
    const runner = handleSubmit(async (data) => {
      const expected = Number(data.frequency || 1);
      if (timesOfDay.length !== expected) {
        toast("Please complete the dosing schedule", { variant: "error" });
        return;
      }
      try {
        const payload = mapFormToApiPayload(data);
        const response = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast("Failed to add medication", { variant: "error" });
          return;
        }
        toast("Medication added", { variant: "success" });
        clearWizardStorage();
        router.push("/medications");
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
    handleSubmit,
    onSubmittingChange,
    router,
    step,
    timesOfDay.length,
    toast,
  ]);

  useEffect(() => {
    if (!submitFormRef) return;
    submitFormRef.current = submitMedication;
    return () => {
      if (submitFormRef.current === submitMedication) {
        submitFormRef.current = null;
      }
    };
  }, [submitFormRef, submitMedication]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 5) {
      void submitMedication();
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
          <section className={stepStyles.step}>
            <div className={stepStyles.surface}>
              <div className={stepStyles.fieldStack}>
                <div className={stepStyles.field}>
                  <div className={stepStyles.labelRow}>
                    <span className={stepStyles.labelText}>
                      How many times per day?
                    </span>
                    <span className={stepStyles.required}>*</span>
                    <HelpTooltip>
                      Set how many reminders you need per day for this
                      medication.
                    </HelpTooltip>
                  </div>
                  <p className={stepStyles.helperText}>
                    Choose the number of doses prescribed for a single day.
                  </p>
                  <input
                    type="hidden"
                    value={Number(freq) || 1}
                    {...register("frequency", { valueAsNumber: true })}
                  />
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {FREQUENCY_OPTIONS.map(({ value, label, description }) => {
                      const isActive = Number(freq) === value;
                      const titleClass = `${stepStyles.cardTitle} ${
                        isActive ? stepStyles.cardTitleActive : ""
                      }`;
                      const descriptionClass = `${stepStyles.cardDescription} ${
                        isActive ? stepStyles.cardDescriptionActive : ""
                      }`;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setValue("frequency", value)}
                          className={`rounded-[20px] border-2 px-5 py-4 text-left transition focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none ${
                            isActive
                              ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                              : "border-[#E5E7EB] bg-white hover:border-[#BFD9FF] hover:bg-[#F8FAFF]"
                          }`}
                        >
                          <span className={titleClass}>{label}</span>
                          <span className={descriptionClass}>
                            {description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={stepStyles.field}>
                  <TimeOfDayChips
                    selected={timesOfDay}
                    onToggle={toggleTime}
                    error={timeError}
                  />
                </div>

                {timesOfDay.length > 0 && (
                  <div className={stepStyles.field}>
                    <TimeInputs selected={timesOfDay} />
                  </div>
                )}

                <div className={stepStyles.field}>
                  <div className={stepStyles.labelRow}>
                    <span className={stepStyles.labelText}>Meal Timing</span>
                    <span className={stepStyles.required}>*</span>
                    <HelpTooltip>
                      Tell us when you usually take this medication relative to
                      meals.
                    </HelpTooltip>
                  </div>
                  <p className={stepStyles.helperText}>
                    Choose the timing that best matches how you take the dose.
                  </p>
                  <input
                    type="hidden"
                    value={mealTiming ?? "before"}
                    {...register("mealTiming")}
                  />
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {MEAL_TIMING_OPTIONS.map(
                      ({ value, label, description }) => {
                        const isActive = mealTiming === value;
                        const titleClass = `${stepStyles.cardTitle} ${
                          isActive ? stepStyles.cardTitleActive : ""
                        }`;
                        const descriptionClass = `${stepStyles.cardDescription} ${
                          isActive ? stepStyles.cardDescriptionActive : ""
                        }`;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue("mealTiming", value)}
                            className={`rounded-[20px] border-2 px-5 py-4 text-left transition focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none ${
                              isActive
                                ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                                : "border-[#E5E7EB] bg-white hover:border-[#BFD9FF] hover:bg-[#F8FAFF]"
                            }`}
                          >
                            <span className={titleClass}>{label}</span>
                            <span className={descriptionClass}>
                              {description}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className={stepStyles.step}>
            <div className={stepStyles.surface}>
              <div className="flex flex-col gap-3">
                <label className="flex items-center text-base font-medium text-gray-900">
                  Select Days of the Week
                  <span className="ml-1 text-red-500">*</span>
                  <HelpTooltip>
                    <div className="space-y-2 text-left">
                      <p className="text-base font-semibold text-white">
                        Choose which days you need to take this medication.
                      </p>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Quick options:
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/80">
                          <li>
                            <strong>All Days:</strong> Every day of the week
                          </li>
                          <li>
                            <strong>Weekdays:</strong> Monday to Friday only
                          </li>
                          <li>
                            <strong>Weekends:</strong> Saturday and Sunday only
                          </li>
                          <li>
                            <strong>Custom:</strong> Tap individual days below
                          </li>
                        </ul>
                      </div>
                      <p className="flex items-start gap-2 text-sm text-[#FBBF24]">
                        <span aria-hidden="true">💡</span>
                        <span>
                          Some medications are only needed on specific days
                          (e.g., weekly supplements on Sundays).
                        </span>
                      </p>
                    </div>
                  </HelpTooltip>
                </label>
                <DaysOfWeekSelector
                  selected={days}
                  onToggle={toggleDay}
                  onApplyPreset={applyDayPreset}
                />
              </div>
            </div>
          </section>
        )}

        {step === 4 && <DatesAndDuration />}

        {step === 5 &&
          (() => {
            const slotOrder: TimeOfDay[] = ["morning", "afternoon", "evening"];
            const selectedSlots = slotOrder.filter((slot) =>
              timesOfDay.includes(slot),
            );
            const displayedSlots =
              selectedSlots.length > 0 ? selectedSlots : [slotOrder[0]];
            const dosesPerDay = Number(allValues.frequency) || 1;
            return (
              <section className={stepStyles.step}>
                <div className={stepStyles.surface}>
                  <div className="space-y-6">
                    <div className="rounded-[24px] border border-[#E5E7EB] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
                      <p className="text-[13px] font-medium tracking-wide text-gray-500 uppercase">
                        Medication
                      </p>
                      <h3 className="mt-1 text-[22px] font-semibold text-[#111827]">
                        {allValues.name?.trim() || "Medication"}
                      </h3>
                      <p className="mt-1 text-[14px] text-gray-600">
                        {Number(allValues.quantity) || 1} unit
                        {Number(allValues.quantity) > 1 ? "s" : ""},{" "}
                        {Number(allValues.dosageMg) || 0} mg
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[14px] font-semibold text-[#111827]">
                            Schedule
                          </p>
                          <span className="text-[13px] font-medium text-[#1479FF]">
                            {MEAL_LABELS[allValues.mealTiming ?? "before"]}
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {displayedSlots.map((slot) => {
                            const key = `${slot}Time` as
                              | "morningTime"
                              | "afternoonTime"
                              | "eveningTime";
                            const value = allValues[key];
                            return (
                              <div
                                key={slot}
                                className="flex items-center gap-3 rounded-[16px] border border-[#E5E7EB] bg-white px-4 py-3"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F2FE]">
                                  <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#1D9BF0"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="7" />
                                    <path d="M12 9v4l2 2" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-[14px] font-semibold text-[#111827]">
                                    {TIME_LABELS[slot]}
                                  </p>
                                  <p className="text-[13px] text-gray-600">
                                    {formatTimeValue(value)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {selectedSlots.length === 0 && (
                          <p className="mt-3 text-[12px] text-[#D97706]">
                            Choose a time of day on Step 2 to finish your
                            schedule.
                          </p>
                        )}
                      </div>

                      <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-5">
                        <p className="text-[14px] font-semibold text-[#111827]">
                          Weekly Frequency
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {days.map((d) => (
                            <span
                              key={d}
                              className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-[13px] font-medium text-[#1E40AF]"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                        <div className="mt-5 rounded-[16px] border border-white bg-white px-4 py-3 shadow-sm">
                          <p className="text-[13px] text-gray-600">
                            Doses per day
                          </p>
                          <p className="text-[20px] font-semibold text-[#111827]">
                            {dosesPerDay}x daily
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-5">
                      <p className="text-[14px] font-semibold text-[#111827]">
                        Duration
                      </p>
                      {allValues.ongoing ? (
                        <p className="mt-2 text-[14px] text-gray-600">
                          Ongoing (lifetime medication)
                        </p>
                      ) : (
                        <>
                          <p className="mt-2 text-[14px] text-gray-600">
                            {Number(allValues.durationDays) || 0} days total
                          </p>
                          <p className="text-[13px] text-gray-500">
                            {formatDateLabel(allValues.startDate)} →{" "}
                            {formatDateLabel(allValues.endDate)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
      </form>
    </FormProvider>
  );
}
