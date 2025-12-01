"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { WizardLayout } from "./WizardLayout";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import {
  MEDICATION_FORMS,
  getMedicationFormLabel,
  type MedicationForm,
} from "@/lib/medicationTypes";
import { useToast } from "@/components/shared/ToastProvider";
import stepStyles from "./MedicationWizardStep1.module.css";
import wizardStyles from "./WizardLayout.module.css";

type Medication = {
  id: string;
  name: string;
  dose: number | null;
  form: string | null;
};

type EditMedicationFormValues = {
  name: string;
  form?: MedicationForm | "";
  dosageMg?: number;
};

const medicationNameTooltip = (
  <>
    <p>
      <strong>Edit the medication name</strong> to match the prescription label.
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

const formTooltip = (
  <>
    <p>Select the physical form so we can show the right reminders.</p>
    <p>This helps personalize your schedule.</p>
  </>
);

type FieldLabelProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optionalText?: string;
  tooltip?: React.ReactNode;
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
    <div className={stepStyles.labelRow}>
      <label htmlFor={htmlFor} className={stepStyles.labelText}>
        {label}
      </label>
      {required && <span className={stepStyles.required}>*</span>}
      {optionalText && (
        <span className={stepStyles.optional}>{optionalText}</span>
      )}
      {tooltip && (
        <HelpTooltip placement={tooltipPlacement}>{tooltip}</HelpTooltip>
      )}
    </div>
  );
}

const dosageValidationRules = {
  setValueAs: (value: unknown) => {
    if (value === "" || value == null) return undefined;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return Number.NaN;
      if (value === 0) return undefined;
      return value;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return undefined;
      if (trimmed.includes(",")) return Number.NaN;
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) return Number.NaN;
      if (numeric === 0) return undefined;
      return numeric;
    }
    return Number.NaN;
  },
  validate: (value?: number) => {
    if (value === undefined) return true;
    if (!Number.isFinite(value)) {
      return "Please enter a valid whole number.";
    }
    if (!Number.isInteger(value)) {
      return "Please enter a whole number.";
    }
    if (value < 1) {
      return "Please enter a value of at least 1.";
    }
    return true;
  },
};

function normalizeFormValue(value: string | null): MedicationForm | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase() as MedicationForm;
  return MEDICATION_FORMS.includes(normalized) ? normalized : undefined;
}

export default function EditMedicationDetailsForm({
  medication,
}: {
  medication: Medication;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditMedicationFormValues>({
    mode: "onBlur",
    defaultValues: {
      name: medication.name,
      form: normalizeFormValue(medication.form) ?? "",
      dosageMg:
        typeof medication.dose === "number" && Number.isFinite(medication.dose)
          ? medication.dose
          : undefined,
    },
  });

  const onSubmit = async (values: EditMedicationFormValues) => {
    const trimmedName = values.name.trim();
    const payload: {
      name?: string;
      dose?: number;
      form?: MedicationForm;
    } = {};

    if (trimmedName && trimmedName !== medication.name) {
      payload.name = trimmedName;
    }

    if (values.dosageMg !== undefined) {
      const roundedDose = Math.round(values.dosageMg);
      if (roundedDose > 0) {
        payload.dose = roundedDose;
      }
    }

    if (values.form) {
      payload.form = values.form;
    }

    if (!payload.name && payload.dose === undefined && !payload.form) {
      toast("No changes to save", { variant: "info" });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/medications/${medication.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Failed to update medication");
      }

      toast("Medication updated", { variant: "success" });
      router.push("/medications");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/medications");
  };

  const actionButtons = (
    <div className={wizardStyles.buttonGroup}>
      <button
        type="submit"
        className={`${wizardStyles.button} ${wizardStyles.buttonPrimary} ${wizardStyles.buttonFullWidth}`}
        disabled={saving}
      >
        {saving ? (
          "Saving..."
        ) : (
          <>
            <span className={wizardStyles.buttonTextFull}>Save changes</span>
            <span className={wizardStyles.buttonTextMobile}>Save</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleBack}
        className={`${wizardStyles.button} ${wizardStyles.buttonCancel} ${wizardStyles.buttonFullWidth} ${wizardStyles.buttonMobileOnly}`}
      >
        Cancel
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <WizardLayout
        step={1}
        totalSteps={1}
        onBack={handleBack}
        title="Edit Medication"
        stepTitle="Basic Information"
        stepSubtitle="Update your medication details"
        stepIcon={<EditStepIcon />}
        showProgressBar={false}
        showActions
        actionButtons={actionButtons}
      >
        <section className={stepStyles.step}>
          <div className={stepStyles.surface}>
            <div className={stepStyles.fieldStack}>
              <div className={stepStyles.field}>
                <FieldLabel
                  htmlFor="medication-name"
                  label="Medication Name"
                  required
                  tooltip={medicationNameTooltip}
                  tooltipPlacement="bottom"
                />
                <input
                  id="medication-name"
                  className={`${stepStyles.input} ${
                    errors.name ? stepStyles.inputError : ""
                  }`}
                  {...register("name", {
                    required: "Name is required",
                  })}
                />
                {errors.name && (
                  <p className={stepStyles.errorText}>
                    {errors.name.message as string}
                  </p>
                )}
              </div>

              <div className={stepStyles.fieldGrid}>
                <div className={stepStyles.field}>
                  <FieldLabel
                    htmlFor="medication-form"
                    label="Medication Form"
                    optionalText="(Optional)"
                    tooltip={formTooltip}
                    tooltipPlacement="bottom"
                  />
                  <div className={stepStyles.selectWrapper}>
                    <select
                      id="medication-form"
                      className={`${stepStyles.select} ${
                        errors.form ? stepStyles.inputError : ""
                      }`}
                      {...register("form")}
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
                  {errors.form && (
                    <p className={stepStyles.errorText}>
                      {errors.form.message as string}
                    </p>
                  )}
                </div>

                <div className={stepStyles.field}>
                  <FieldLabel
                    htmlFor="medication-dosage"
                    label="Dosage (mg)"
                    optionalText="(Optional)"
                    tooltip={dosageTooltip}
                    tooltipPlacement="bottom"
                  />
                  <input
                    id="medication-dosage"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className={`${stepStyles.input} ${
                      errors.dosageMg ? stepStyles.inputError : ""
                    }`}
                    {...register("dosageMg", dosageValidationRules)}
                  />
                  {errors.dosageMg && (
                    <p className={stepStyles.errorText}>
                      {errors.dosageMg.message as string}
                    </p>
                  )}
                </div>
              </div>

              {error && <p className={stepStyles.errorText}>{error}</p>}
            </div>
          </div>
        </section>
      </WizardLayout>
    </form>
  );
}

function EditStepIcon() {
  const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: "2" as const,
  };

  return (
    <svg
      {...iconProps}
      stroke="#1479FF"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 20.5 20.5 10.5a4.95 4.95 0 0 0-7-7L3.5 13.5a4.95 4.95 0 0 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}
