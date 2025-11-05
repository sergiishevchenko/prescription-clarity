import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must not exceed 255 characters"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
