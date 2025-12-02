import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters")
    .optional(),
  dateOfBirth: z
    .string()
    .datetime({ message: "Invalid date of birth" })
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
