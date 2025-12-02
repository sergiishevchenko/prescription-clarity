import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/auth/session";
import { getAdherenceSummariesForUser } from "@/lib/adherence";

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

    // Helper to calculate age in full years from a Date
    const calculateAge = (
      dateOfBirth: Date | null | undefined,
    ): number | null => {
      if (!dateOfBirth) return null;
      const today = new Date();
      let age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
      ) {
        age -= 1;
      }
      return age >= 0 ? age : null;
    };

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
            dateOfBirth: true,
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
            dateOfBirth: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Pre-compute adherence summaries for people I'm caring for (owner side)
    const caringForWithAdherence = await Promise.all(
      caringFor.map(async (access) => {
        const summaries = await getAdherenceSummariesForUser(access.ownerId);
        const last7 =
          summaries.find((s) => s.windowDays === 7)?.adherence ?? null;
        const last30 =
          summaries.find((s) => s.windowDays === 30)?.adherence ?? null;

        return {
          access,
          adherence7Days: last7,
          adherence30Days: last30,
        };
      }),
    );

    return NextResponse.json(
      {
        viewers: myViewers.map((access) => {
          const age = calculateAge(access.viewer.dateOfBirth);
          return {
            accessId: access.id,
            userId: access.viewerId,
            user: {
              id: access.viewer.id,
              email: access.viewer.email,
              name: access.viewer.name,
              dateOfBirth: access.viewer.dateOfBirth,
              age,
            },
            grantedAt: access.createdAt,
            updatedAt: access.updatedAt,
          };
        }),
        caringFor: caringForWithAdherence.map(
          ({ access, adherence7Days, adherence30Days }) => {
            const age = calculateAge(access.owner.dateOfBirth);
            return {
              accessId: access.id,
              userId: access.ownerId,
              user: {
                id: access.owner.id,
                email: access.owner.email,
                name: access.owner.name,
                dateOfBirth: access.owner.dateOfBirth,
                age,
                adherence7Days,
                adherence30Days,
              },
              grantedAt: access.createdAt,
              updatedAt: access.updatedAt,
            };
          },
        ),
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
