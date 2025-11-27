import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import {
  createShareLinkSchema,
  type CreateShareLinkInput,
} from "@/lib/validators/share";
import { generateShareToken, getDefaultExpiry } from "@/lib/share/token";

export const runtime = "nodejs";

/**
 * POST /api/share
 * Create a new share link for the authenticated user
 * Returns share URL and token details
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
    const validatedData: CreateShareLinkInput =
      createShareLinkSchema.parse(body);

    // Generate secure token
    const token = generateShareToken();

    // Set expiration (default 48 hours or custom)
    const expiresAt = validatedData.expiresAt || getDefaultExpiry();

    // Create ShareLink in database
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        ownerId: user.id,
        expiresAt,
        status: "active",
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        status: true,
        createdAt: true,
      },
    });

    // Construct share URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const shareUrl = `${baseUrl}/api/share/accept?token=${token}`;

    return NextResponse.json(
      {
        shareLink: {
          id: shareLink.id,
          shareUrl,
          token: shareLink.token,
          expiresAt: shareLink.expiresAt,
          status: shareLink.status,
          createdAt: shareLink.createdAt,
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
    console.error("POST /api/share error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
