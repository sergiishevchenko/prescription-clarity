import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionMaxAge } from "./session";

export function buildSessionCookie(token: string) {
  const name = getSessionCookieName();
  const maxAgeSec = Math.floor(getSessionMaxAge() / 1000);

  return {
    name,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: maxAgeSec,
      path: "/",
    },
  };
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  return cookieStore.get(cookieName)?.value ?? null;
}

export function getSessionCookieKey() {
  return getSessionCookieName();
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(getSessionCookieName());
}

export function setSessionCookie(res: NextResponse, token: string) {
  const cfg = buildSessionCookie(token);
  res.cookies.set(cfg.name, cfg.value, cfg.options);
}
