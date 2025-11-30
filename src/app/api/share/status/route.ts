import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { shareStatusQuerySchema } from "@/lib/validators/share";

export const runtime = "nodejs";

/**
 * GET /api/share/status
 * Get all share links for the authenticated user
 * Optional query param: status (active, revoked, expired, all)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getSessionUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "active";

    // Validate query params
    const validatedQuery = shareStatusQuerySchema.parse({
      status: statusParam,
    });

    // Fetch all share links for this owner.
    // We filter by effective status (including computed expiry) in memory below.
    const shareLinks = await prisma.shareLink.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        token: true,
        viewerId: true,
        expiresAt: true,
        status: true,
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

    const now = new Date();

    function getEffectiveStatus(link: {
      status: "active" | "revoked" | "expired";
      expiresAt: Date;
    }): "active" | "revoked" | "expired" {
      if (link.status === "revoked") return "revoked";

      const isExpired = link.expiresAt < now || link.status === "expired";
      if (isExpired) return "expired";

      return "active";
    }

    const targetStatus = validatedQuery.status ?? "active";

    const filteredLinks =
      targetStatus === "all"
        ? shareLinks
        : shareLinks.filter(
            (link) => getEffectiveStatus(link) === targetStatus,
          );

    return NextResponse.json(
      {
        shareLinks: filteredLinks.map((link) => ({
          id: link.id,
          token: link.token,
          viewerId: link.viewerId,
          viewer: link.viewer,
          expiresAt: link.expiresAt,
          status: getEffectiveStatus(link),
          createdAt: link.createdAt,
          updatedAt: link.updatedAt,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }
    console.error("GET /api/share/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
