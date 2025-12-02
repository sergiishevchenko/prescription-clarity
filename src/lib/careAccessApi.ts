export type CareAccessUser = {
  id: string;
  email: string;
  name: string | null;
  age?: number | null;
};

export type CareAccessEntry = {
  accessId: string;
  userId: string;
  user: CareAccessUser | null;
  grantedAt: string;
  updatedAt: string;
};

export type CareAccessOverviewResponse = {
  viewers: CareAccessEntry[];
  caringFor: CareAccessEntry[];
};

export async function getCareAccessOverviewClient(): Promise<CareAccessOverviewResponse> {
  const res = await fetch("/api/care-access", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return { viewers: [], caringFor: [] };
  }

  if (!res.ok) {
    throw new Error("Failed to load care access overview");
  }

  return (await res.json()) as CareAccessOverviewResponse;
}

export async function revokeCareAccess(accessId: string): Promise<void> {
  const params = new URLSearchParams();
  params.set("accessId", accessId);

  const res = await fetch(`/api/care-access?${params.toString()}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let message = "Failed to revoke care access";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }
}
