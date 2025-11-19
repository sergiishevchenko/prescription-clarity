"use client";

import type { ReactNode } from "react";

import DatesAndDuration from "../../DatesAndDuration";
import stepStyles from "../../MedicationWizardStep1.module.css";

type Props = {
  medicationSummary: ReactNode | null;
};

export function TreatmentDurationStep({ medicationSummary }: Props) {
  return (
    <section className={stepStyles.step}>
      <div className={stepStyles.surface}>
        {medicationSummary}
        <DatesAndDuration />
      </div>
    </section>
  );
}
