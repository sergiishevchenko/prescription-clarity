export type ShareLinkStatus = "active" | "revoked" | "expired";

export type ShareLinkViewer = {
  id: string;
  email: string;
  name: string | null;
} | null;

export type ShareLinkItem = {
  id: string;
  token: string;
  viewerId: string | null;
  viewer: ShareLinkViewer;
  expiresAt: string;
  status: ShareLinkStatus;
  createdAt: string;
  updatedAt: string;
};

export type ShareStatusFilter =
  | "active"
  | "revoked"
  | "expired"
  | "all"
  | undefined;

export async function getShareStatus(
  status: ShareStatusFilter = "active",
): Promise<ShareLinkItem[]> {
  const params = new URLSearchParams();
  if (status && status !== "active") {
    params.set("status", status);
  }

  const url =
    "/api/share/status" + (params.toString() ? `?${params.toString()}` : "");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = "Failed to load share status";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing errors and use default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { shareLinks: ShareLinkItem[] };
  return data.shareLinks;
}

export type CreateShareLinkPayload = {
  /**
   * Optional expiration date.
   * If omitted, backend will use default (48 hours).
   */
  expiresAt?: Date | string;
};

export type CreatedShareLink = {
  id: string;
  shareUrl: string;
  token: string;
  expiresAt: string;
  status: ShareLinkStatus;
  createdAt: string;
};

export async function createShareLink(
  payload?: CreateShareLinkPayload,
): Promise<CreatedShareLink> {
  const body: Record<string, unknown> = {};

  if (payload?.expiresAt) {
    body.expiresAt =
      payload.expiresAt instanceof Date
        ? payload.expiresAt.toISOString()
        : payload.expiresAt;
  }

  const res = await fetch("/api/share", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = "Failed to create share link";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing errors and use default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { shareLink: CreatedShareLink };
  return data.shareLink;
}

export type RevokeSharePayload = {
  token?: string;
  shareId?: string;
};

export type RevokedShareLink = {
  id: string;
  token: string;
  status: ShareLinkStatus;
  revokedAt: string;
};

export async function revokeShareLink(
  payload: RevokeSharePayload,
): Promise<RevokedShareLink> {
  const res = await fetch("/api/share/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to revoke share link";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing errors and use default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as {
    success?: boolean;
    shareLink: RevokedShareLink;
  };

  return data.shareLink;
}
