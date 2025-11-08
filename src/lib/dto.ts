import { z } from "zod";

export const clientMedicationFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  quantity: z.coerce.number().int().positive(),
  dosageMg: z.coerce.number().int().positive(),
  mealTiming: z.enum(["before", "with", "after", "anytime"]),
  frequency: z.coerce.number().int().min(1).max(6),
  durationDays: z.coerce.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  ongoing: z.boolean().optional().default(false),
  morningTime: z.string().optional(),
  afternoonTime: z.string().optional(),
  eveningTime: z.string().optional(),
});

export type ClientMedicationForm = z.infer<typeof clientMedicationFormSchema>;

export type CreateMedicationDTO = {
  name: string;
  dose: string;
  frequency: number;
  startDate: string; // ISO
  endDate: string; // ISO
};

function toISODate(dateYMD: string) {
  return new Date(dateYMD + "T00:00:00.000Z").toISOString();
}

export function toCreateMedicationDTO(
  form: ClientMedicationForm,
): CreateMedicationDTO {
  const dose = `${Number(form.quantity)} x ${Number(form.dosageMg)} mg (${form.mealTiming})`;
  const start = form.startDate;
  const duration = Number(form.durationDays || 30);
  let end = form.endDate;
  if (!end || form.ongoing) {
    const s = new Date(start + "T00:00:00");
    const e = new Date(s);
    e.setDate(s.getDate() + duration - 1);
    end = e.toISOString().slice(0, 10);
  }
  return {
    name: form.name.trim(),
    dose,
    frequency: Number(form.frequency),
    startDate: toISODate(start),
    endDate: toISODate(end),
  };
}
