import { z } from "zod";

export const generateScheduleSchema = z.object({
  medicationId: z.string().min(1, "medicationId is required"),
});

export const scheduleQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  tz: z.string().optional(), // IANA timezone name (e.g., Europe/Kyiv)
});

export const updateScheduleStatusSchema = z.object({
  status: z.enum(["PLANNED", "DONE"]),
});

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
export type UpdateScheduleStatusInput = z.infer<
  typeof updateScheduleStatusSchema
>;
