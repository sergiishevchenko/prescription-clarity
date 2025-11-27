import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * GET /api/care-access
 * Get care access relationships for the authenticated user
 * Returns two lists:
 * - viewers: People who have access to view my data
 * - caringFor: People whose data I have access to view
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get people who can view my data (I am the owner)
    const myViewers = await prisma.careAccess.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        viewerId: true,
        createdAt: true,
        updatedAt: true,
        viewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get people whose data I can view (I am the viewer)
    const caringFor = await prisma.careAccess.findMany({
      where: {
        viewerId: user.id,
      },
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        viewers: myViewers.map((access) => ({
          accessId: access.id,
          userId: access.viewerId,
          user: access.viewer,
          grantedAt: access.createdAt,
          updatedAt: access.updatedAt,
        })),
        caringFor: caringFor.map((access) => ({
          accessId: access.id,
          userId: access.ownerId,
          user: access.owner,
          grantedAt: access.createdAt,
          updatedAt: access.updatedAt,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/care-access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/care-access?accessId=xxx
 * Remove care access (only owner can revoke)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get accessId from query
    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get("accessId");

    if (!accessId) {
      return NextResponse.json(
        { error: "Missing accessId parameter" },
        { status: 400 },
      );
    }

    // Find the care access record
    const careAccess = await prisma.careAccess.findUnique({
      where: { id: accessId },
      select: {
        id: true,
        ownerId: true,
        viewerId: true,
      },
    });

    if (!careAccess) {
      return NextResponse.json(
        { error: "Care access not found" },
        { status: 404 },
      );
    }

    // Only the owner can revoke access
    if (careAccess.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the owner can revoke care access" },
        { status: 403 },
      );
    }

    // Delete the care access
    await prisma.careAccess.delete({
      where: { id: accessId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Care access revoked successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/care-access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
