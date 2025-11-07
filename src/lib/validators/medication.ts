import { z } from "zod";

export const createMedicationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Medication name must not exceed 150 characters"),
  dose: z
    .string()
    .min(1, "Dose is required")
    .max(100, "Dose must not exceed 100 characters"),
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
  frequency: z.coerce.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
