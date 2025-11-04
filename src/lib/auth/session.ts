import { prisma } from "@/lib/db";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "SESSION_ID";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // ms

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

// — вспомогательные —
function sha256Hex(str: string) {
  return createHash("sha256").update(str, "utf8").digest("hex");
}

function generateTokenHex(bytes = 32) {
  return randomBytes(bytes).toString("hex"); // 64-символьный hex
}

// — основное —
export async function createSession(userId: string): Promise<string> {
  const token = generateTokenHex(); // raw token для cookie
  const tokenHash = sha256Hex(token); // хранить только хеш

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

export async function verifySession(
  token: string,
): Promise<SessionUser | null> {
  if (!token) return null;

  const tokenHash = sha256Hex(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  const tokenHash = sha256Hex(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE; // ms (используем для expiresAt, а в cookies.ts конвертим в секунды!)
}

/** Дістати значення SESSION cookie з заголовка Cookie: ... */
export function extractTokenFromRequest(req: Request): string | null {
  const name = getSessionCookieName();
  const cookieHeader = req.headers.get("cookie") || "";
  const m = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] ?? null;
}

/** Отримати користувача із cookie у Next.js Route Handler (через next/headers) */
export async function getSessionUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value || "";
  return verifySession(token);
}

/** Отримати користувача, якщо маєш об’єкт Request */
export async function getSessionUserFromRequest(req: Request) {
  const token = extractTokenFromRequest(req) || "";
  return verifySession(token);
}
