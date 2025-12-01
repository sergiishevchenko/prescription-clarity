"use client";

import type { ShareStatusFilter } from "@/lib/shareApi";
import { RevokeButton } from "./RevokeButton";

export type ShareStatus = Exclude<ShareStatusFilter, undefined | "all">;

export type ShareListItem = {
  id: string;
  name: string;
  email: string;
  connectedSince: string;
  status: ShareStatus;
};

export type ShareListProps = {
  items: ShareListItem[];
  revokingId?: string | null;
  onRevoke: (id: string) => void;
};

function formatStatusLabel(status: ShareStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "revoked":
      return "Revoked";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export function ShareList({ items, revokingId, onRevoke }: ShareListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {item.name}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.status === "active"
                    ? "bg-green-50 text-green-700"
                    : item.status === "revoked"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {formatStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{item.email}</p>
            <p className="mt-1 text-xs text-gray-500">
              Created on {item.connectedSince}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {item.status === "active" ? (
              <RevokeButton
                onClick={() => onRevoke(item.id)}
                loading={revokingId === item.id}
                disabled={revokingId === item.id}
              />
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                {formatStatusLabel(item.status)}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
