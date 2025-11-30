"use client";

import type { ReactNode } from "react";
import { useFormContext, type UseFormRegisterReturn } from "react-hook-form";

import TimeInputs from "../../TimeInputs";
import TimeOfDayChips from "../../TimeOfDayChips";
import stepStyles from "../../MedicationWizardStep1.module.css";
import {
  MEDICATION_FORMS,
  type FormValues,
  type MedicationForm,
  type TimeOfDay,
  getMedicationFormLabel,
} from "@/lib/medicationTypes";

import {
  FRACTION_OPTIONS,
  FREQUENCY_OPTIONS,
  MEAL_TIMING_OPTIONS,
} from "../constants";

type Props = {
  medicationSummary: ReactNode | null;
  quantityFieldRegister: UseFormRegisterReturn;
  quantityError?: string;
  quantityWholeValue: number | "";
  quantityFractionValue: number;
  onWholeQuantityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFractionQuantityChange: (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => void;
  unitsValue?: MedicationForm;
  onUnitsChange: (value: MedicationForm | undefined) => void;
  frequencyValue: number;
  frequencyFieldRegister: UseFormRegisterReturn;
  onFrequencyChange: (value: number) => void;
  mealTimingValue?: FormValues["mealTiming"];
  mealTimingFieldRegister: UseFormRegisterReturn;
  onMealTimingChange: (value: FormValues["mealTiming"]) => void;
  timesOfDay: TimeOfDay[];
  timeError: string;
  onToggleTime: (slot: TimeOfDay) => void;
};

export function DosingScheduleStep({
  medicationSummary,
  quantityFieldRegister,
  quantityError,
  quantityWholeValue,
  quantityFractionValue,
  onWholeQuantityChange,
  onFractionQuantityChange,
  unitsValue,
  onUnitsChange,
  frequencyValue,
  frequencyFieldRegister,
  onFrequencyChange,
  mealTimingValue,
  mealTimingFieldRegister,
  onMealTimingChange,
  timesOfDay,
  timeError,
  onToggleTime,
}: Props) {
  const {
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <section className={stepStyles.step}>
      <div className={stepStyles.surface}>
        {medicationSummary}
        <div className={stepStyles.fieldStack}>
          <input type="hidden" {...quantityFieldRegister} />

          <div className={stepStyles.quantityGrid}>
            <div className={stepStyles.quantityField}>
              <label
                htmlFor="quantity-whole"
                className={stepStyles.quantityLabel}
              >
                Quantity
              </label>
              <div className={stepStyles.quantityInputs}>
                <input
                  id="quantity-whole"
                  type="number"
                  min={0}
                  max={1000}
                  className={stepStyles.input}
                  value={quantityWholeValue}
                  onChange={onWholeQuantityChange}
                  placeholder="0"
                />
              </div>
              <p className={stepStyles.helperText}>Whole units (0-1000)</p>
            </div>

            <div className={stepStyles.quantityField}>
              <label
                htmlFor="quantity-fraction"
                className={stepStyles.quantityLabel}
              >
                Fraction
              </label>
              <div className={stepStyles.selectWrapper}>
                <select
                  id="quantity-fraction"
                  className={stepStyles.select}
                  value={quantityFractionValue}
                  onChange={onFractionQuantityChange}
                >
                  {FRACTION_OPTIONS.map(({ value, label }) => (
                    <option key={label} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <svg
                  className={stepStyles.selectChevron}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className={stepStyles.helperText}>
                Fractional part of the dose
              </p>
            </div>

            <div className={stepStyles.quantityField}>
              <label
                htmlFor="medication-units"
                className={stepStyles.quantityLabel}
              >
                Units
              </label>
              <div className={stepStyles.selectWrapper}>
                <select
                  id="medication-units"
                  className={stepStyles.select}
                  value={unitsValue ?? ""}
                  onChange={(event) =>
                    onUnitsChange(
                      event.target.value
                        ? (event.target.value as MedicationForm)
                        : undefined,
                    )
                  }
                  aria-invalid={Boolean(errors.form) || undefined}
                  style={
                    errors.form
                      ? {
                          borderColor: "#ef4444",
                          boxShadow: "0 0 0 1px #fecaca",
                        }
                      : undefined
                  }
                >
                  <option value="">Select a form</option>
                  {MEDICATION_FORMS.map((value) => (
                    <option key={value} value={value}>
                      {getMedicationFormLabel(value)}
                    </option>
                  ))}
                </select>
                <svg
                  className={stepStyles.selectChevron}
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className={stepStyles.helperText}>
                Same list as the medication form
              </p>
              {errors.form && (
                <p className={stepStyles.errorText}>
                  {errors.form.message as string}
                </p>
              )}
            </div>
          </div>

          {quantityError && (
            <p className={stepStyles.errorText}>{quantityError}</p>
          )}

          <div className={stepStyles.field}>
            <div className={stepStyles.labelRow}>
              <span className={stepStyles.labelText}>
                How many times per day?
              </span>
              <span className={stepStyles.required}>*</span>
            </div>
            <p className={stepStyles.helperText}>
              Choose the number of doses prescribed for a single day.
            </p>
            <input
              type="hidden"
              value={Number(frequencyValue) || 1}
              {...frequencyFieldRegister}
            />
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-4">
              {FREQUENCY_OPTIONS.map(({ value, label, description }) => {
                const isActive = Number(frequencyValue) === value;
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
                    onClick={() => onFrequencyChange(value)}
                    className={`rounded-[14px] border-2 px-3.5 py-2.5 text-left transition focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none sm:rounded-[20px] sm:px-5 sm:py-4 ${
                      isActive
                        ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                        : "border-[#E5E7EB] bg-white hover:border-[#BFD9FF] hover:bg-[#F8FAFF]"
                    }`}
                  >
                    <span className={titleClass}>{label}</span>
                    <span className={descriptionClass}>{description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={stepStyles.field}>
            <TimeOfDayChips
              selected={timesOfDay}
              onToggle={onToggleTime}
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
            </div>
            <p className={stepStyles.helperText}>
              Choose the timing that best matches how you take the dose.
            </p>
            <input
              type="hidden"
              value={mealTimingValue ?? "before"}
              {...mealTimingFieldRegister}
            />
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:mt-4 sm:gap-4 md:grid-cols-2">
              {MEAL_TIMING_OPTIONS.map(({ value, label, description }) => {
                const isActive = mealTimingValue === value;
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
                    onClick={() => onMealTimingChange(value)}
                    className={`rounded-[14px] border-2 px-3.5 py-2.5 text-left transition focus-visible:ring-4 focus-visible:ring-[#1479FF]/20 focus-visible:outline-none sm:rounded-[20px] sm:px-5 sm:py-4 ${
                      isActive
                        ? "border-[#1479FF] bg-[#F0F7FF] shadow-[0_18px_35px_rgba(20,121,255,0.2)]"
                        : "border-[#E5E7EB] bg-white hover:border-[#BFD9FF] hover:bg-[#F8FAFF]"
                    }`}
                  >
                    <span className={titleClass}>{label}</span>
                    <span className={descriptionClass}>{description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
