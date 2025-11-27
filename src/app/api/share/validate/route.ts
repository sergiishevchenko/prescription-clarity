import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTokenSchema } from "@/lib/validators/share";

export const runtime = "nodejs";

/**
 * GET /api/share/validate?token=xxx
 * Validate a share token (public endpoint, no auth required)
 * Checks if token exists, is active, and not expired
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validate token parameter
    const validatedData = validateTokenSchema.parse({ token });

    // Find share link by token
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: validatedData.token },
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
        expiresAt: true,
        status: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Token doesn't exist
    if (!shareLink) {
      return NextResponse.json(
        {
          valid: false,
          error: "Token not found",
        },
        { status: 404 },
      );
    }

    // Check if revoked
    if (shareLink.status === "revoked") {
      return NextResponse.json(
        {
          valid: false,
          error: "Token has been revoked",
          status: shareLink.status,
        },
        { status: 200 },
      );
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

      return NextResponse.json(
        {
          valid: false,
          error: "Token has expired",
          status: "expired",
          expiresAt: shareLink.expiresAt,
        },
        { status: 200 },
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        valid: true,
        shareLink: {
          id: shareLink.id,
          ownerId: shareLink.ownerId,
          viewerId: shareLink.viewerId,
          expiresAt: shareLink.expiresAt,
          status: shareLink.status,
          owner: shareLink.owner,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid token parameter" },
        { status: 400 },
      );
    }
    console.error("GET /api/share/validate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
