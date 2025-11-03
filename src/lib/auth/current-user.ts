import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";

export async function getCurrentUser() {
  const token = await getSessionCookie();
  if (!token) return null;
  const user = await verifySession(token);
  return user; // { id, email, name } | null
}
