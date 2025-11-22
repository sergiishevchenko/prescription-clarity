"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { WizardLayout } from "@/components/medications/WizardLayout";
import NewMedicationForm, {
  type StepValidatorFn,
} from "@/components/medications/NewMedicationForm";
import MedicationWizardStep1 from "@/components/medications/MedicationWizardStep1";
import { useToast } from "@/components/shared/ToastProvider";
import styles from "@/components/medications/WizardLayout.module.css";
import {
  persistWizardStep,
  readWizardStep,
} from "@/lib/medicationWizardStorage";

export default function NewMedicationFormPage() {
  const router = useRouter();
  const toast = useToast();
  const totalSteps = 5;

  // Початково завжди 1 — без читання localStorage / readWizardStep у SSR
  const [step, setStep] = useState(1);
  const [isStepValid, setIsStepValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateStepRef = useRef<StepValidatorFn | null>(null);
  const ensureMedicationRef = useRef<(() => Promise<boolean>) | null>(null);
  const submitFormRef = useRef<(() => Promise<void> | void) | null>(null);

  // Після гідратації відновлюємо крок з storage
  useEffect(() => {
    const stored = readWizardStep(totalSteps);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(stored);
  }, [totalSteps]);

  // Зберігаємо поточний крок
  useEffect(() => {
    persistWizardStep(step);
  }, [step, totalSteps]);

  const handleNext = async () => {
    if (step >= totalSteps) return;

    if (validateStepRef.current) {
      const validator = validateStepRef.current;
      const valid = await validator();
      if (!valid) {
        if (validator.lastErrorMessage) {
          toast(validator.lastErrorMessage, { variant: "error" });
        } else {
          showStepError(step);
        }
        return;
      }
    } else if (!isStepValid) {
      showStepError(step);
      return;
    }

    if (step === 1 && ensureMedicationRef.current) {
      const ensured = await ensureMedicationRef.current();
      if (!ensured) {
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleBack = () => {
    router.push("/medications");
  };

  const showStepError = (currentStep: number) => {
    const errors: Record<number, string> = {
      1: "Please fill in the medication name",
      2: "Please complete the dosing schedule",
      3: "Please select at least one day",
      4: "Please complete the treatment duration",
    };
    toast(errors[currentStep] || "Please complete all required fields", {
      variant: "error",
    });
  };

  const titleMap: Record<number, string> = {
    1: "Basic Information",
    2: "Dosing Schedule",
    3: "Weekly Frequency",
    4: "Treatment Duration",
    5: "Review & Confirm",
  };

  const subtitleMap: Record<number, string> = {
    1: "Enter the medication details",
    2: "When do you take this medication?",
    3: "Which days do you take this medication?",
    4: "How long will you take this medication?",
    5: "Please review your medication details",
  };

  const getStepIcon = () => {
    const iconProps = {
      viewBox: "0 0 24 24",
      fill: "none",
      strokeWidth: "2",
    };
    switch (step) {
      case 1:
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
      case 2:
        return (
          <svg
            {...iconProps}
            stroke="#1D9BF0"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="7" />
            <path d="M12 9v4l2 2" />
          </svg>
        );
      case 3:
        return (
          <svg {...iconProps} stroke="#1D9BF0">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16" />
          </svg>
        );
      case 4:
        return (
          <svg {...iconProps} stroke="#1D9BF0">
            <circle cx="12" cy="13" r="7" />
            <path d="M12 10v4l2 2" />
            <path d="M9 3h6" />
          </svg>
        );
      case 5:
        return (
          <svg {...iconProps} stroke="#22C55E">
            <circle cx="12" cy="12" r="7" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActionButtons = () => {
    if (step !== 5) return undefined;

    const handleAddSchedule = () => {
      submitFormRef.current?.();
    };

    return (
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={handlePrev}
          className={`${styles.button} ${styles.buttonSecondary}`}
        >
          <svg
            className={styles.buttonIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Previous
        </button>
        <button
          type="button"
          onClick={handleAddSchedule}
          className={`${styles.button} ${styles.buttonSuccess}`}
          disabled={isSubmitting}
        >
          <svg
            className={`${styles.buttonIcon} ${styles.buttonIconLarge}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              d="M9 12l2 2 4-4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isSubmitting ? "Saving..." : "Add Schedule"}
        </button>
      </div>
    );
  };

  return (
    <WizardLayout
      step={step}
      totalSteps={totalSteps}
      onBack={handleBack}
      onPrevious={handlePrev}
      onNext={step < totalSteps ? handleNext : undefined}
      nextLabel={step === totalSteps ? undefined : "Next"}
      stepTitle={titleMap[step]}
      stepSubtitle={subtitleMap[step]}
      stepIcon={getStepIcon()}
      helpText={
        step === 1
          ? "Taking a photo helps you identify your medication easily"
          : undefined
      }
      actionButtons={getActionButtons()}
    >
      <NewMedicationForm
        step={step}
        stepOneComponent={<MedicationWizardStep1 />}
        onValidate={setIsStepValid}
        validateStepRef={validateStepRef}
        ensureMedicationRef={ensureMedicationRef}
        submitFormRef={submitFormRef}
        onSubmittingChange={setIsSubmitting}
      />
    </WizardLayout>
  );
}
