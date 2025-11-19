import type { FormValues, TimeOfDay } from "./medicationTypes";

const FORM_STATE_KEY = "medication-wizard-form";
const STEP_STATE_KEY = "medication-wizard-step";

export type SerializableFormValues = Omit<FormValues, "photo">;

export type StoredWizardFormState = {
  formValues?: Partial<SerializableFormValues>;
  timesOfDay?: TimeOfDay[];
  days?: string[];
};

const ALL_TIME_SLOTS: TimeOfDay[] = ["morning", "afternoon", "evening"];

const getStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const sanitizeTimesOfDay = (value?: unknown) => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((slot): slot is TimeOfDay =>
    ALL_TIME_SLOTS.includes(slot as TimeOfDay),
  );
};

const sanitizeDays = (value?: unknown) => {
  if (!Array.isArray(value)) return undefined;
  return value.filter((day): day is string => typeof day === "string");
};

export const readWizardFormState = (): StoredWizardFormState | null => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(FORM_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      formValues:
        parsed.formValues && typeof parsed.formValues === "object"
          ? parsed.formValues
          : undefined,
      timesOfDay: sanitizeTimesOfDay(parsed.timesOfDay),
      days: sanitizeDays(parsed.days),
    };
  } catch {
    return null;
  }
};

export const persistWizardFormState = (state: StoredWizardFormState) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(FORM_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
};

export const clearWizardFormState = () => {
  const storage = getStorage();
  storage?.removeItem(FORM_STATE_KEY);
};

const clampStep = (value: number, totalSteps: number) => {
  if (Number.isNaN(value)) return 1;
  return Math.min(Math.max(Math.floor(value), 1), totalSteps);
};

export const readWizardStep = (totalSteps: number) => {
  const storage = getStorage();
  if (!storage) return 1;
  const raw = storage.getItem(STEP_STATE_KEY);
  if (!raw) return 1;
  const parsed = Number(raw);
  return clampStep(parsed, totalSteps);
};

export const persistWizardStep = (step: number) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STEP_STATE_KEY, String(step));
  } catch {
    // ignore
  }
};

export const clearWizardStep = () => {
  const storage = getStorage();
  storage?.removeItem(STEP_STATE_KEY);
};

export const clearWizardStorage = () => {
  clearWizardFormState();
  clearWizardStep();
};

export const clearMedicationWizard = () => {
  clearWizardFormState();
  clearWizardStep();
};
