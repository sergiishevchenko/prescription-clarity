import { z } from "zod";

const validForms = [
  "tablets",
  "capsules",
  "lozenges",
  "candy",
  "drops",
  "ampoule",
  "syringe",
  "packet",
  "sachet",
  "stick",
  "g",
  "mg",
  "ml",
  "dose",
  "teaspoon",
  "tablespoon",
] as const;

export const createMedicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Medication name must not exceed 150 characters"),
  dose: z.coerce
    .number()
    .int()
    .positive("Dose must be a positive integer")
    .optional(),
  form: z
    .string()
    .max(50, "Form must not exceed 50 characters")
    .refine((val) => validForms.includes(val as (typeof validForms)[number]), {
      message: `Form must be one of: ${validForms.join(", ")}`,
    })
    .optional(),
});

export const updateMedicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Medication name must not exceed 150 characters")
    .optional(),
  dose: z.coerce
    .number()
    .int()
    .positive("Dose must be a positive integer")
    .optional(),
  form: z
    .string()
    .min(1, "Form is required")
    .max(50, "Form must not exceed 50 characters")
    .refine((val) => validForms.includes(val as (typeof validForms)[number]), {
      message: `Form must be one of: ${validForms.join(", ")}`,
    })
    .optional(),
  // If true, creates a new medication version instead of updating in place
  // This will soft delete the old version and create a new one with link
  createVersion: z.boolean().optional(),
});

export const searchMedicationSchema = z.object({
  name: z
    .string()
    .min(3, "Search query must be at least 3 characters")
    .max(150, "Search query must not exceed 150 characters"),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type SearchMedicationInput = z.infer<typeof searchMedicationSchema>;
