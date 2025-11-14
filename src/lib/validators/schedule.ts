import { z } from "zod";

export const generateScheduleSchema = z.object({
  medicationId: z.string().min(1, "medicationId is required").optional(),
  scheduleId: z.string().min(1, "scheduleId is required").optional(),
}).refine(
  (data) => data.medicationId || data.scheduleId,
  {
    message: "Either medicationId or scheduleId must be provided",
  }
);

export const scheduleQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  tz: z.string().optional(), // IANA timezone name (e.g., Europe/Kyiv)
});

export const updateScheduleStatusSchema = z.object({
  status: z.enum(["PLANNED", "DONE"]),
});

export const createScheduleSchema = z.object({
  medicineId: z.string().min(1, "medicineId is required"),
  quantity: z.coerce.number().int().positive().default(1),
  units: z.string().min(1).max(50).default("pill"),
  frequencyDays: z.array(z.number().int().min(1).max(7)).min(1, "At least one day must be selected"),
  durationDays: z.coerce.number().int().min(0).max(365),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateStart must be in YYYY-MM-DD format"),
  timeOfDay: z.array(z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "timeOfDay must be in HH:MM format")).min(1, "At least one time must be specified"),
  mealTiming: z.enum(["before", "with", "after", "anytime"]).default("anytime"),
});

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
export type UpdateScheduleStatusInput = z.infer<
  typeof updateScheduleStatusSchema
>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
