import { z } from "zod";

const validUnits = [
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
  dose: z
    .string()
    .min(1, "Dose is required")
    .max(100, "Dose must not exceed 100 characters"),
  units: z
    .string()
    .min(1, "Units are required")
    .max(50, "Units must not exceed 50 characters")
    .refine((val) => validUnits.includes(val as (typeof validUnits)[number]), {
      message: `Units must be one of: ${validUnits.join(", ")}`,
    }),
  frequency: z.coerce.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateMedicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Medication name must not exceed 150 characters")
    .optional(),
  dose: z
    .string()
    .min(1, "Dose is required")
    .max(100, "Dose must not exceed 100 characters")
    .optional(),
  units: z
    .string()
    .min(1, "Units are required")
    .max(50, "Units must not exceed 50 characters")
    .refine((val) => validUnits.includes(val as (typeof validUnits)[number]), {
      message: `Units must be one of: ${validUnits.join(", ")}`,
    })
    .optional(),
  frequency: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
