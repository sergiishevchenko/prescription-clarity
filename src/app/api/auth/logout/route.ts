import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
  try {
    // 1) Читаем текущий токен
    const sessionToken = await getSessionCookie();

    // 2) Удаляем сессию из базы
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    // 3) Готовим ответ и очищаем cookie
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
