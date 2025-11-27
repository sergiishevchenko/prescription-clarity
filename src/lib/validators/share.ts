import { z } from "zod";

/**
 * Schema for creating a share link
 * Optional expiresAt - if not provided, defaults to 48 hours
 */
export const createShareLinkSchema = z.object({
  expiresAt: z.coerce.date().optional(),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

/**
 * Schema for revoking a share link
 * Requires either token or shareId
 */
export const revokeShareLinkSchema = z
  .object({
    token: z.string().min(1).optional(),
    shareId: z.string().min(1).optional(),
  })
  .refine((data) => data.token || data.shareId, {
    message: "Either token or shareId must be provided",
  });

export type RevokeShareLinkInput = z.infer<typeof revokeShareLinkSchema>;

/**
 * Schema for validating a token
 */
export const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type ValidateTokenInput = z.infer<typeof validateTokenSchema>;

/**
 * Schema for accepting a share link
 */
export const acceptShareLinkSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type AcceptShareLinkInput = z.infer<typeof acceptShareLinkSchema>;

/**
 * Schema for querying share status
 */
export const shareStatusQuerySchema = z.object({
  status: z.enum(["active", "revoked", "expired", "all"]).optional(),
});

export type ShareStatusQueryInput = z.infer<typeof shareStatusQuerySchema>;
