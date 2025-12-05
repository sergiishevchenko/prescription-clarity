import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
  try {
    const sessionToken = await getSessionCookie();

    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const res = NextResponse.json({ success: true });
    clearSessionCookie(res);

    return res;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
