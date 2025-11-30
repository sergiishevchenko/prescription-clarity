import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/url";

export type CareAccessUser = {
  id: string;
  email: string;
  name: string | null;
};

export type CareAccessEntry = {
  accessId: string;
  userId: string;
  user: CareAccessUser | null;
  grantedAt: string;
  updatedAt: string;
};

export type CareAccessOverview = {
  viewers: CareAccessEntry[];
  caringFor: CareAccessEntry[];
};

export async function getCareAccessOverview(): Promise<CareAccessOverview | null> {
  const store = await cookies();

  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const res = await fetch(absoluteUrl("/api/care-access"), {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return null;
  }

  if (!res.ok) {
    throw new Error("Failed to load care access overview");
  }

  const data = (await res.json()) as CareAccessOverview;
  return data;
}
