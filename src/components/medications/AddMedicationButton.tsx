"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { clearMedicationWizard } from "@/lib/medicationWizardStorage";
import { WIZARD_RESET_EVENT } from "./wizard/constants";

export default function AddMedicationButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    clearMedicationWizard();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(WIZARD_RESET_EVENT));
    }
    startTransition(() => {
      router.push("/medications/new");
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
      disabled={isPending}
    >
      {isPending ? "Opening..." : "Add"}
    </button>
  );
}
