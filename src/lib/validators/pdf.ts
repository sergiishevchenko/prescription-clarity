import { z } from "zod";

const dateOnlyRegExp = /^\d{4}-\d{2}-\d{2}$/;

export const exportPdfSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  from: z
    .string()
    .min(1, "from date is required")
    .refine(
      (value) => dateOnlyRegExp.test(value) || !Number.isNaN(Date.parse(value)),
      "from must be an ISO date (YYYY-MM-DD or ISO string)",
    ),
  to: z
    .string()
    .min(1, "to date is required")
    .refine(
      (value) => dateOnlyRegExp.test(value) || !Number.isNaN(Date.parse(value)),
      "to must be an ISO date (YYYY-MM-DD or ISO string)",
    ),
  tz: z.string().default("UTC"),
});

export type ExportPdfInput = z.infer<typeof exportPdfSchema>;
