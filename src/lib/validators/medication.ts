import { z } from "zod";

export const createMedicationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dose: z.string().min(1, "Dose is required"),
  frequency: z.coerce.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
