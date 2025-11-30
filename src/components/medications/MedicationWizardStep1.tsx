"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFormContext } from "react-hook-form";

import { HelpTooltip } from "@/components/shared/HelpTooltip";
import {
  MEDICATION_FORMS,
  getMedicationFormLabel,
  type FormValues,
  type MedicationForm,
} from "@/lib/medicationTypes";
import styles from "./MedicationWizardStep1.module.css";

const PhotoUploader = dynamic(() => import("./PhotoUploader"), { ssr: false });

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

const photoTooltip = (
  <>
    <p>Adding a quick photo makes it easier to recognize medications.</p>
    <p>You can upload up to 5MB in PNG or JPG format.</p>
  </>
);

const MIN_SEARCH_QUERY = 3;

type MedicationSearchResult = {
  id: string;
  name: string;
  dose?: string | number | null;
  form?: string | null;
};

const toMedicationFormValue = (
  value?: string | null,
): MedicationForm | undefined => {
  if (!value) return undefined;
  const normalized = value.toLowerCase() as MedicationForm;
  return MEDICATION_FORMS.includes(normalized) ? normalized : undefined;
};

const parseDoseValue = (value?: string | number | null) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
};

type FieldLabelProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optionalText?: string;
  tooltip?: ReactNode;
  tooltipPlacement?: "top" | "bottom";
  tabletLineBreak?: boolean;
};

function FieldLabel({
  label,
  htmlFor,
  required,
  optionalText,
  tooltip,
  tooltipPlacement = "top",
  tabletLineBreak = false,
}: FieldLabelProps) {
  return (
    <div
      className={`${styles.labelRow} ${
        tabletLineBreak ? styles.labelRowTabletBreak : ""
      }`}
    >
      <label htmlFor={htmlFor} className={styles.labelText}>
        {label}
      </label>
      {required && <span className={styles.required}>*</span>}
      {optionalText && <span className={styles.optional}>{optionalText}</span>}
      {tooltip && (
        <HelpTooltip placement={tooltipPlacement}>{tooltip}</HelpTooltip>
      )}
    </div>
  );
}

export default function MedicationWizardStep1() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useFormContext<FormValues>();
  const nameValue = watch("name") ?? "";
  const medicationIdValue = watch("medicationId") ?? "";
  const [searchResults, setSearchResults] = useState<MedicationSearchResult[]>(
    [],
  );
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedNameRef = useRef<string>("");

  const hideSearchResultsSoon = useCallback(() => {
    const enqueue =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (cb: () => void) => {
            Promise.resolve().then(cb);
          };
    enqueue(() => {
      setSearchResults([]);
      setShowResults(false);
    });
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const query = nameValue.trim();
    const normalized = query.toLowerCase();
    const normalizedSelection = selectedNameRef.current;
    if (normalizedSelection && normalized !== normalizedSelection) {
      if (medicationIdValue) {
        setValue("medicationId", "", { shouldDirty: true });
      }
      selectedNameRef.current = "";
    }
    if (query.length < MIN_SEARCH_QUERY) {
      hideSearchResultsSoon();
      return;
    }
    if (normalizedSelection && normalized === normalizedSelection) {
      hideSearchResultsSoon();
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch("/api/medications/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            console.warn(
              "Medication search unavailable, skipping suggestions",
              response.status,
            );
            if (!cancelled) {
              setSearchResults([]);
              setShowResults(false);
            }
            return;
          }
          const data = (await response.json()) as {
            medications?: MedicationSearchResult[];
          };
          if (!cancelled) {
            const nextResults = data.medications ?? [];
            setSearchResults(nextResults);
            setShowResults(nextResults.length > 0);
          }
        })
        .catch((error: Error) => {
          if (cancelled || error.name === "AbortError") return;
          console.error("Medication search failed", error);
          setSearchResults([]);
          setShowResults(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hideSearchResultsSoon, medicationIdValue, nameValue, setValue]);

  const handleSelectMedication = (result: MedicationSearchResult) => {
    setValue("medicationId", result.id, { shouldDirty: true });
    setValue("name", result.name, { shouldDirty: true });
    const parsedDose = parseDoseValue(result.dose);
    setValue("dosageMg", parsedDose, {
      shouldDirty: true,
      shouldValidate: true,
    });
    const normalizedForm = toMedicationFormValue(result.form);
    if (normalizedForm) {
      setValue("form", normalizedForm, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    selectedNameRef.current = result.name.trim().toLowerCase();
    setShowResults(false);
    setSearchResults([]);
  };

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

  const renderResultMeta = (result: MedicationSearchResult) => {
    const doseText =
      typeof result.dose === "number"
        ? `${result.dose} mg`
        : typeof result.dose === "string"
          ? result.dose
          : null;
    const normalizedForm = toMedicationFormValue(result.form);
    const formText = normalizedForm
      ? getMedicationFormLabel(normalizedForm)
      : getMedicationFormLabel(result.form as MedicationForm);
    return [doseText, formText].filter(Boolean).join(" · ");
  };

  return (
    <section className={styles.step}>
      <div className={styles.surface}>
        <div className={styles.fieldStack}>
          <input type="hidden" {...register("medicationId")} />
          <div
            className={`${styles.field} ${styles.searchContainer}`}
            ref={searchContainerRef}
          >
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
                onChange: () => {
                  if (errors.name) clearErrors("name");
                },
              })}
              onFocus={() => {
                if (
                  searchResults.length > 0 &&
                  nameValue.trim().length >= MIN_SEARCH_QUERY
                ) {
                  setShowResults(true);
                }
              }}
            />
            {errors.name && (
              <p className={styles.errorText}>
                {errors.name.message as string}
              </p>
            )}
            {showResults && (
              <div className={styles.searchResults}>
                {searchResults.map((result) => {
                  const meta = renderResultMeta(result);
                  return (
                    <button
                      key={result.id}
                      type="button"
                      className={styles.searchResultButton}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectMedication(result);
                      }}
                    >
                      <span className={styles.searchResultTitle}>
                        {result.name}
                      </span>
                      {meta && (
                        <span className={styles.searchResultMeta}>{meta}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <FieldLabel
                htmlFor="medication-form"
                label="Medication Form"
                optionalText="(Optional)"
                tooltip={formTooltip}
                tooltipPlacement="bottom"
                tabletLineBreak
              />
              <div className={styles.selectWrapper}>
                <select
                  id="medication-form"
                  className={`${styles.select} ${
                    errors.form ? styles.inputError : ""
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
              {errors.form && (
                <p className={styles.errorText}>
                  {errors.form.message as string}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <FieldLabel
                htmlFor="medication-dosage"
                label="Dosage (mg)"
                optionalText="(Optional)"
                tooltip={dosageTooltip}
                tooltipPlacement="bottom"
                tabletLineBreak
              />
              <input
                id="medication-dosage"
                type="number"
                min={1}
                inputMode="numeric"
                className={`${styles.input} ${
                  errors.dosageMg ? styles.inputError : ""
                }`}
                {...register("dosageMg", dosageValidationRules)}
              />
              {errors.dosageMg && (
                <p className={styles.errorText}>
                  {errors.dosageMg.message as string}
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
