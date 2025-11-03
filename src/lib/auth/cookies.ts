import "server-only";
import { cookies } from "next/headers";
import { getSessionCookieName, getSessionMaxAge } from "./session";

// Генерим конфиг cookie (используем в route handler'ах)
export function buildSessionCookie(token: string) {
  const name = getSessionCookieName();
  const maxAgeSec = Math.floor(getSessionMaxAge() / 1000); // из мс → в секунды

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

// ЧТЕНИЕ cookie (read-only) — ок для Server Components
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies(); // в твоей сборке cookies() — Promise<...>
  const cookieName = getSessionCookieName();
  return cookieStore.get(cookieName)?.value ?? null;
}

// Имя cookie — пригодится для удаления в handler'ах
export function getSessionCookieKey() {
  return getSessionCookieName();
}
