import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  revokeShareLinkSchema,
  type RevokeShareLinkInput,
} from "@/lib/validators/share";

export const runtime = "nodejs";

/**
 * POST /api/share/revoke
 * Revoke a share link (change status to 'revoked')
 * Requires ownership of the share link
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (owner)
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: RevokeShareLinkInput =
      revokeShareLinkSchema.parse(body);

    // Find the share link by token or shareId
    const whereClause = validatedData.token
      ? { token: validatedData.token }
      : { id: validatedData.shareId };

    const shareLink = await prisma.shareLink.findFirst({
      where: whereClause,
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
        status: true,
      },
    });

    // Check if share link exists
    if (!shareLink) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 },
      );
    }

    // Check ownership
    if (shareLink.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this share link" },
        { status: 403 },
      );
    }

    // Update status to revoked and remove any permanent care access
    const updatedShareLink = await prisma.$transaction(async (tx) => {
      const link = await tx.shareLink.update({
        where: { id: shareLink.id },
        data: { status: "revoked" },
        select: {
          id: true,
          token: true,
          status: true,
          updatedAt: true,
        },
      });

      // If this link has an associated viewer, remove their permanent access
      if (shareLink.viewerId) {
        await tx.careAccess.deleteMany({
          where: {
            ownerId: user.id,
            viewerId: shareLink.viewerId,
          },
        });
      }

      return link;
    });

    return NextResponse.json(
      {
        success: true,
        shareLink: {
          id: updatedShareLink.id,
          token: updatedShareLink.token,
          status: updatedShareLink.status,
          revokedAt: updatedShareLink.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 },
      );
    }
    console.error("POST /api/share/revoke error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
