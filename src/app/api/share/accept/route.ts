import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  acceptShareLinkSchema,
  type AcceptShareLinkInput,
} from "@/lib/validators/share";

export const runtime = "nodejs";

/**
 * GET /api/share/accept?token=xxx
 * Redirects browser requests to the UI page /share/accept
 * so users opening the raw share link see a friendly screen.
 * This does not change the POST behavior used by the API.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = "/share/accept";
  return NextResponse.redirect(url);
}

/**
 * POST /api/share/accept
 * Accept a share link and create permanent CareAccess
 * Requires authentication (viewer must be logged in)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (viewer)
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: AcceptShareLinkInput =
      acceptShareLinkSchema.parse(body);

    // Find share link by token
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: validatedData.token },
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
        expiresAt: true,
        status: true,
      },
    });

    // Check if token exists
    if (!shareLink) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 },
      );
    }

    // Check if revoked
    if (shareLink.status === "revoked") {
      return NextResponse.json(
        { error: "Share link has been revoked" },
        { status: 403 },
      );
    }

    // Check if expired
    const now = new Date();
    if (shareLink.expiresAt < now || shareLink.status === "expired") {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 403 },
      );
    }

    // Prevent owner from accepting their own link
    if (shareLink.ownerId === user.id) {
      return NextResponse.json(
        { error: "Cannot accept your own share link" },
        { status: 400 },
      );
    }

    // Check if already accepted by this user
    const existingAccess = await prisma.careAccess.findUnique({
      where: {
        ownerId_viewerId: {
          ownerId: shareLink.ownerId,
          viewerId: user.id,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        {
          success: true,
          message: "Access already granted",
          careAccess: {
            id: existingAccess.id,
            ownerId: existingAccess.ownerId,
            viewerId: existingAccess.viewerId,
            createdAt: existingAccess.createdAt,
          },
          alreadyExists: true,
        },
        { status: 200 },
      );
    }

    // Use transaction to update ShareLink and create CareAccess
    const result = await prisma.$transaction(async (tx) => {
      // Update ShareLink with viewerId if not already set
      const updatedShareLink = await tx.shareLink.update({
        where: { id: shareLink.id },
        data: {
          viewerId: shareLink.viewerId || user.id,
        },
        select: {
          id: true,
          token: true,
          ownerId: true,
          viewerId: true,
        },
      });

      // Create permanent CareAccess
      const careAccess = await tx.careAccess.create({
        data: {
          ownerId: shareLink.ownerId,
          viewerId: user.id,
        },
        select: {
          id: true,
          ownerId: true,
          viewerId: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return { updatedShareLink, careAccess };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Share link accepted successfully",
        careAccess: {
          id: result.careAccess.id,
          ownerId: result.careAccess.ownerId,
          viewerId: result.careAccess.viewerId,
          createdAt: result.careAccess.createdAt,
          owner: result.careAccess.owner,
        },
        shareLink: {
          id: result.updatedShareLink.id,
          token: result.updatedShareLink.token,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("POST /api/share/accept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
