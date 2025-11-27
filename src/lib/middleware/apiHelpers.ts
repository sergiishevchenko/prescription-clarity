import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  getShareAccessContext,
  hasResourceAccess,
  type ShareAccessContext,
} from "./shareAccess";

export interface ApiAccessResult {
  authorized: boolean;
  response?: NextResponse;
  context?: ShareAccessContext;
}

/**
 * Check if authenticated user has access to a resource
 * Supports both session-based auth and share token auth
 *
 * @param request - Next.js request object
 * @param ownerId - The owner of the resource being accessed
 * @param requiredRole - Minimum role required ("owner" or "viewer")
 * @returns Access result with authorization status and context
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const { authorized, response, context } = await checkApiAccess(
 *     request,
 *     "user123",
 *     "viewer"
 *   );
 *
 *   if (!authorized) return response!;
 *
 *   // Use context.role to determine permissions
 *   // context.userId is the authenticated user
 *   // context.ownerId is the resource owner
 * }
 * ```
 */
export async function checkApiAccess(
  request: NextRequest,
  ownerId: string,
  requiredRole: "owner" | "viewer" = "viewer",
): Promise<ApiAccessResult> {
  // First, authenticate the user
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Get share access context (checks tokens and care access)
  const context = await getShareAccessContext(request, user.id, ownerId);

  // Check if user has required access level
  const hasAccess = hasResourceAccess(context.role, requiredRole);

  if (!hasAccess) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: "Forbidden: You do not have access to this resource",
          required: requiredRole,
          actual: context.role,
        },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    context,
  };
}

/**
 * Helper to extract target user ID from request
 * Checks query params and body for userId/ownerId
 */
export async function extractTargetUserId(
  request: NextRequest,
): Promise<string | null> {
  // Check query parameters
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get("userId") || searchParams.get("ownerId");
  if (queryUserId) {
    return queryUserId;
  }

  // Check request body for POST/PATCH
  if (request.method === "POST" || request.method === "PATCH") {
    try {
      const body = await request.json();
      return body.userId || body.ownerId || null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Simplified access check for routes where ownerId is in query/body
 * Automatically extracts ownerId and checks access
 */
export async function checkApiAccessAuto(
  request: NextRequest,
  requiredRole: "owner" | "viewer" = "viewer",
): Promise<ApiAccessResult> {
  const ownerId = await extractTargetUserId(request);

  if (!ownerId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Missing userId or ownerId parameter" },
        { status: 400 },
      ),
    };
  }

  return checkApiAccess(request, ownerId, requiredRole);
}
