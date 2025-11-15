"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/shared/ToastProvider";
import DosageAndQuantity from "./DosageAndQuantity";
import TimeOfDayChips from "./TimeOfDayChips";
import TimeInputs from "./TimeInputs";
import DaysOfWeekSelector from "./DaysOfWeekSelector";
import DatesAndDuration from "./DatesAndDuration";
import type { FormValues, TimeOfDay } from "@/lib/medicationTypes";
import { DAY_LABELS } from "@/lib/medicationTypes";

type NewMedicationFormProps = {
  step: number;
  stepOneComponent: ReactNode;
  onValidate?: (isValid: boolean) => void;
  validateStepRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
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

export default function NewMedicationForm({
  step,
  stepOneComponent,
  onValidate,
  validateStepRef,
}: NewMedicationFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>([]);
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
    },
  });

  const { register, handleSubmit, control, setValue, trigger } = methods;
  const freq = useWatch({ control, name: "frequency" });
  const allValues = methods.watch();

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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (step !== 5) {
      e.preventDefault();
      return;
    }
    handleSubmit(async (data) => {
      const expected = Number(data.frequency || 1);
      if (timesOfDay.length !== expected) {
        toast("Please complete the dosing schedule", { variant: "error" });
        return;
      }
      try {
        const response = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          toast("Failed to add medication", { variant: "error" });
          return;
        }
        toast("Medication added", { variant: "success" });
        router.push("/medications");
      } catch {
        toast("Network error", { variant: "error" });
      }
    })(e);
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
          <>
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-3">
                How many times per day?
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue("frequency", value)}
                    className={[
                      "flex flex-col items-start rounded-[16px] border px-4 py-3 text-left transition",
                      "hover:border-[#1D9BF0] hover:bg-[#EFF6FF]",
                      freq === value
                        ? "border-[#1D9BF0] bg-[#EFF6FF]"
                        : "border-gray-300 bg-white",
                    ].join(" ")}
                  >
                    <span className="text-[18px] font-semibold text-[#111827]">
                      {value}x
                    </span>
                    <span className="mt-1 text-[14px] text-gray-500">
                      {value === 1
                        ? "Once"
                        : value === 2
                        ? "Twice"
                        : "Three times"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <TimeOfDayChips
              selected={timesOfDay}
              onToggle={toggleTime}
              error={timeError}
            />

            <TimeInputs selected={timesOfDay} />

            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-2">
                Meal Timing
              </label>
              <select
                className="block w-full rounded-[12px] border border-gray-300 bg-white px-3 py-2.5 text-[14px] text-gray-900 shadow-sm focus:border-[#1D9BF0] focus:ring-2 focus:ring-[#1D9BF0]/40 focus:outline-none"
                {...register("mealTiming")}
              >
                <option value="before">Before Meal</option>
                <option value="with">With Meal</option>
                <option value="after">After Meal</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </>
        )}

        {step === 3 && (
          <DaysOfWeekSelector selected={days} onToggle={toggleDay} />
        )}

        {step === 4 && <DatesAndDuration />}

        {step === 5 && (
          (() => {
            const primarySlot = timesOfDay[0] ?? "morning";
            const primaryTime = allValues[
              `${primarySlot}Time` as "morningTime" | "afternoonTime" | "eveningTime"
            ];
            return (
          <div className="rounded-[24px] bg-white border border-[#E5E7EB] shadow-sm px-6 py-6 space-y-6">
            <div>
              <h3 className="text-[20px] font-semibold text-[#111827]">
                {allValues.name || "Medication"}
              </h3>
              <p className="mt-1 text-[14px] text-gray-600">
                {Number(allValues.quantity) || 1} unit
                {Number(allValues.quantity) > 1 ? "s" : ""},{" "}
                {Number(allValues.dosageMg) || 0} mg
              </p>
            </div>

            <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-4 space-y-2">
              <p className="text-[14px] font-semibold text-[#111827] mb-1">
                Schedule
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E0F2FE] flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
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
                  <p className="text-[14px] font-medium text-[#111827]">
                    {TIME_LABELS[primarySlot]} — {formatTimeValue(primaryTime)}
                  </p>
                </div>
              </div>
              <p className="text-[14px] text-gray-600">
                {MEAL_LABELS[allValues.mealTiming ?? "before"]}
              </p>
            </div>

            <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-4 space-y-2">
              <p className="text-[14px] font-semibold text-[#111827] mb-1">
                Frequency
              </p>
              <div className="flex flex-wrap gap-2">
                {days.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 rounded-full border border-[#93C5FD] bg-[#EFF6FF] text-[13px] text-[#1D4ED8]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] bg-[#F9FAFB] px-5 py-4 space-y-2">
              <p className="text-[14px] font-semibold text-[#111827] mb-1">
                Duration
              </p>
              {allValues.ongoing ? (
                <p className="text-[14px] text-gray-600">
                  Ongoing (lifetime medication)
                </p>
              ) : (
                <p className="text-[14px] text-gray-600">
                  {Number(allValues.durationDays) || 0} days
                </p>
              )}
            </div>
          </div>
            );
          })()
        )}
      </form>
    </FormProvider>
  );
}
