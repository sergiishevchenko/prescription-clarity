"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import type { FormValues } from "@/lib/medicationTypes";
import styles from "./MedicationWizardStep1.module.css";

const PhotoUploader = dynamic(() => import("./PhotoUploader"), { ssr: false });

const UNIT_OPTIONS = [
  { value: "tablets", label: "Tablets" },
  { value: "capsules", label: "Capsules" },
  { value: "lozenges", label: "Lozenges" },
  { value: "candy", label: "Candy" },
  { value: "drops", label: "Drops" },
  { value: "ampoule", label: "Ampoule" },
  { value: "syringe", label: "Syringe" },
  { value: "packet", label: "Packet" },
  { value: "sachet", label: "Sachet" },
  { value: "stick", label: "Stick" },
  { value: "g", label: "Grams (g)" },
  { value: "mg", label: "Milligrams (mg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "dose", label: "Dose" },
  { value: "teaspoon", label: "Teaspoon" },
  { value: "tablespoon", label: "Tablespoon" },
] as const;

const medicationNameTooltip = (
  <>
    <p>
      <strong>Enter the full medication name</strong> exactly as it appears on
      the prescription label.
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
      <li>Lisinopril</li>
      <li>Metformin</li>
      <li>Aspirin</li>
      <li>Vitamin D3</li>
    </ul>
  </>
);

const quantityTooltip = (
  <>
    <p>
      How many <strong>units you take per dose</strong>. This might be tablets,
      capsules, or milliliters.
    </p>
    <ul>
      <li>1 tablet</li>
      <li>2 capsules</li>
      <li>5 ml liquid</li>
    </ul>
  </>
);

const dosageTooltip = (
  <>
    <p>
      The <strong>potency of each dose</strong>. Look for a number followed by
      mg, mcg, or IU on your prescription.
    </p>
    <ul>
      <li>10 mg</li>
      <li>500 mg</li>
      <li>100 mcg</li>
    </ul>
  </>
);

const unitTooltip = (
  <>
    <p>Select the form that best matches how you take this medication.</p>
    <ul>
      <li>Tablets or capsules</li>
      <li>Liquid drops</li>
      <li>Topical gel or cream</li>
    </ul>
  </>
);

const photoTooltip = (
  <>
    <p>Adding a quick photo makes it easier to recognize medications.</p>
    <p>You can upload up to 5MB in PNG or JPG format.</p>
  </>
);

type FieldLabelProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optionalText?: string;
  tooltip?: ReactNode;
  tooltipPlacement?: "top" | "bottom";
};

function FieldLabel({
  label,
  htmlFor,
  required,
  optionalText,
  tooltip,
  tooltipPlacement = "top",
}: FieldLabelProps) {
  return (
    <div className={styles.labelRow}>
      <label htmlFor={htmlFor} className={styles.labelText}>
        {label}
      </label>
      {required && <span className={styles.required}>*</span>}
      {optionalText && <span className={styles.optional}>{optionalText}</span>}
      {tooltip && <HelpTooltip placement={tooltipPlacement}>{tooltip}</HelpTooltip>}
    </div>
  );
}

export default function MedicationWizardStep1() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <section className={styles.step}>
      <div className={styles.surface}>
        <div className={styles.fieldStack}>
          <div className={styles.field}>
            <FieldLabel
              htmlFor="medication-name"
              label="Medication Name"
              required
              tooltip={medicationNameTooltip}
              tooltipPlacement="bottom"
            />
            <input
              id="medication-name"
              placeholder="e.g., Aspirin"
              className={`${styles.input} ${
                errors.name ? styles.inputError : ""
              }`}
              {...register("name", {
                required: "Please enter the name of the medication.",
              })}
            />
            {errors.name && (
              <p className={styles.errorText}>
                {errors.name.message as string}
              </p>
            )}
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <FieldLabel
                htmlFor="medication-quantity"
                label="Quantity"
                required
                tooltip={quantityTooltip}
                tooltipPlacement="bottom"
              />
              <input
                id="medication-quantity"
                type="number"
                min={1}
                inputMode="numeric"
                className={`${styles.input} ${
                  errors.quantity ? styles.inputError : ""
                }`}
                {...register("quantity", {
                  valueAsNumber: true,
                  required: "Please enter the quantity you take per dose.",
                  min: {
                    value: 1,
                    message: "Please enter a value of at least 1.",
                  },
                })}
              />
              {errors.quantity && (
                <p className={styles.errorText}>
                  {errors.quantity.message as string}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <FieldLabel
                htmlFor="medication-dosage"
                label="Dosage (mg)"
                required
                tooltip={dosageTooltip}
                tooltipPlacement="bottom"
              />
              <input
                id="medication-dosage"
                type="number"
                min={1}
                inputMode="numeric"
                className={`${styles.input} ${
                  errors.dosageMg ? styles.inputError : ""
                }`}
                {...register("dosageMg", {
                  valueAsNumber: true,
                  required: "Please enter the dosage amount in milligrams.",
                  min: {
                    value: 1,
                    message: "Please enter a value of at least 1.",
                  },
                })}
              />
              {errors.dosageMg && (
                <p className={styles.errorText}>
                  {errors.dosageMg.message as string}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <FieldLabel
                htmlFor="medication-unit"
                label="Units"
                required
                tooltip={unitTooltip}
                tooltipPlacement="bottom"
              />
              <div className={styles.selectWrapper}>
                <select
                  id="medication-unit"
                  className={`${styles.select} ${
                    errors.unit ? styles.inputError : ""
                  }`}
                  {...register("unit", {
                    required: "Please select the appropriate unit.",
                  })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  className={styles.selectChevron}
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
              {errors.unit && (
                <p className={styles.errorText}>
                  {errors.unit.message as string}
                </p>
              )}
            </div>
          </div>

          <div className={styles.photoSection}>
            <FieldLabel
              label="Medication Photo"
              optionalText="(Optional)"
              tooltip={photoTooltip}
              tooltipPlacement="bottom"
            />
            <div className={styles.photoContent}>
              <PhotoUploader />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
