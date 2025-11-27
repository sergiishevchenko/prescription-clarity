import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export type UserRole = "owner" | "viewer" | "anonymous";

export interface ShareAccessContext {
  userId: string;
  role: UserRole;
  ownerId: string;
  shareToken?: string;
}

/**
 * Extract share token from request
 * Checks query params (?token=xxx) and Authorization header (Bearer xxx)
 */
export function extractShareToken(request: NextRequest): string | null {
  // Check query parameter
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("token");
  if (queryToken) {
    return queryToken;
  }

  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Validate share token and get share link details
 * Returns null if token is invalid, revoked, or expired
 */
export async function validateShareToken(token: string): Promise<{
  id: string;
  ownerId: string;
  viewerId: string | null;
  status: string;
} | null> {
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    select: {
      id: true,
      ownerId: true,
      viewerId: true,
      expiresAt: true,
      status: true,
    },
  });

  if (!shareLink) {
    return null;
  }

  // Check if revoked
  if (shareLink.status === "revoked") {
    return null;
  }

  // Check if expired
  const now = new Date();
  const isExpired = shareLink.expiresAt < now;

  if (isExpired || shareLink.status === "expired") {
    // Update status to expired if not already
    if (shareLink.status !== "expired") {
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: { status: "expired" },
      });
    }
    return null;
  }

  return {
    id: shareLink.id,
    ownerId: shareLink.ownerId,
    viewerId: shareLink.viewerId,
    status: shareLink.status,
  };
}

/**
 * Check if user has care access to owner's profile
 */
export async function checkCareAccess(
  ownerId: string,
  viewerId: string,
): Promise<boolean> {
  const careAccess = await prisma.careAccess.findUnique({
    where: {
      ownerId_viewerId: {
        ownerId,
        viewerId,
      },
    },
  });

  return !!careAccess;
}

/**
 * Determine user role in relation to a profile/resource
 * Returns role based on:
 * 1. If userId === ownerId → "owner"
 * 2. If has valid share token → "viewer"
 * 3. If has permanent care access → "viewer"
 * 4. Otherwise → "anonymous"
 */
export async function getUserRole(
  userId: string,
  ownerId: string,
  shareToken?: string,
): Promise<UserRole> {
  // Owner has full access
  if (userId === ownerId) {
    return "owner";
  }

  // Check share token if provided
  if (shareToken) {
    const shareLink = await validateShareToken(shareToken);
    if (shareLink && shareLink.ownerId === ownerId) {
      return "viewer";
    }
  }

  // Check permanent care access
  const hasCareAccess = await checkCareAccess(ownerId, userId);
  if (hasCareAccess) {
    return "viewer";
  }

  return "anonymous";
}

/**
 * Check if user has access to a resource based on role
 */
export function hasResourceAccess(
  role: UserRole,
  requiredRole: "owner" | "viewer",
): boolean {
  if (requiredRole === "owner") {
    return role === "owner";
  }

  if (requiredRole === "viewer") {
    return role === "owner" || role === "viewer";
  }

  return false;
}

/**
 * Get share access context for a request
 * Extracts token, validates it, and determines user role
 */
export async function getShareAccessContext(
  request: NextRequest,
  userId: string,
  ownerId: string,
): Promise<ShareAccessContext> {
  const shareToken = extractShareToken(request);
  const role = await getUserRole(userId, ownerId, shareToken || undefined);

  return {
    userId,
    role,
    ownerId,
    shareToken: shareToken || undefined,
  };
}
