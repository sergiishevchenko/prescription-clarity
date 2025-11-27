import crypto from "crypto";

/**
 * Generates a secure random token for share links
 * Uses crypto.randomBytes for cryptographic security
 * Returns a URL-safe base64 string
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Calculates expiration date for share link
 * Default: 48 hours from now
 */
export function getDefaultExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
}
