"use client";

import { useEffect, useState } from "react";
import {
  createShareLink,
  getShareStatus,
  revokeShareLink,
  type CreatedShareLink,
  type ShareLinkItem,
  type ShareStatusFilter,
} from "@/lib/shareApi";
import { useConfirm, useToast } from "@/components/shared/ToastProvider";
import { type ShareListItem, ShareList } from "@/components/share/ShareList";
import { CreateLinkModal } from "@/components/share/CreateLinkModal";
import {
  getCareAccessOverviewClient,
  revokeCareAccess,
  type CareAccessEntry,
} from "@/lib/careAccessApi";
import { RevokeButton } from "@/components/share/RevokeButton";

/* LEGACY MOCK IMPLEMENTATION (kept for reference)

type ShareAccess = {
  id: string;
  name: string;
  role: string;
  email: string;
  connectedSince: string;
  status: "active" | "revoked";
};

const INITIAL_ACCESS_LIST: ShareAccess[] = [
  {
    id: "1",
    name: "Anna Johnson",
    role: "Caregiver",
    email: "caregiver@demo.com",
    connectedSince: "26.10.2025",
    status: "active",
  },
  {
    id: "2",
    name: "Dr. Sarah Mitchell",
    role: "Doctor",
    email: "doctor@demo.com",
    connectedSince: "26.09.2025",
    status: "active",
  },
];

export default function LegacyDataSharingPage() {
  const [accessList, setAccessList] =
    useState<ShareAccess[]>(INITIAL_ACCESS_LIST);

  const handleRevoke = (id: string) => {
    setAccessList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "revoked" } : item,
      ),
    );
  };

  const activeCount = accessList.filter(
    (item) => item.status === "active",
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Data Sharing</h1>
          <p className="mt-1 text-gray-600">
            Manage who can access your health data.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-sm font-medium">
                Who Has Access ({activeCount})
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="text-lg leading-none">＋</span>
              Invite
            </button>
          </div>

          <div className="space-y-4">
            {accessList.map((item) => (
              <article
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      {item.name}
                    </h2>
                    <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                      {item.role}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{item.email}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Connected since {item.connectedSince}
                    {item.status === "revoked" ? " · Access revoked" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {item.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <span className="text-base leading-none">🧍‍♂️</span>
                      Revoke
                    </button>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                      Revoked
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

*/

function mapShareLinkToView(link: ShareLinkItem): ShareListItem {
  const viewerName =
    link.viewer?.name || link.viewer?.email || "Pending viewer";
  const viewerEmail = link.viewer?.email || "Awaiting acceptance";
  const created = new Date(link.createdAt);

  return {
    id: link.id,
    name: viewerName,
    email: viewerEmail,
    connectedSince: created.toLocaleDateString(),
    status: link.status as ShareListItem["status"],
  };
}

function mapCreatedShareLinkToView(link: CreatedShareLink): ShareListItem {
  const created = new Date(link.createdAt);

  return {
    id: link.id,
    name: "Pending viewer",
    email: "Awaiting acceptance",
    connectedSince: created.toLocaleDateString(),
    status: link.status,
  };
}

export default function DataSharingPage() {
  const toast = useToast();
  const confirm = useConfirm();

  const [statusFilter, setStatusFilter] = useState<ShareStatusFilter>("active");
  const [accessList, setAccessList] = useState<ShareListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [viewerAccessList, setViewerAccessList] = useState<CareAccessEntry[]>(
    [],
  );
  const [isLoadingViewers, setIsLoadingViewers] = useState<boolean>(true);
  const [viewersError, setViewersError] = useState<string | null>(null);
  const [revokingAccessId, setRevokingAccessId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const links = await getShareStatus(statusFilter);
        if (cancelled) return;
        setAccessList(links.map(mapShareLinkToView));
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load access list";
        setError(message);
        setAccessList([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewers() {
      setIsLoadingViewers(true);
      setViewersError(null);
      try {
        const overview = await getCareAccessOverviewClient();
        if (cancelled) return;
        setViewerAccessList(overview.viewers);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load current viewers";
        setViewersError(message);
        setViewerAccessList([]);
      } finally {
        if (!cancelled) {
          setIsLoadingViewers(false);
        }
      }
    }

    void loadViewers();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = accessList.filter(
    (item) => item.status === "active",
  ).length;

  async function handleCreateLink() {
    setCreateError(null);
    setIsCreating(true);
    try {
      const link = await createShareLink();
      setNewShareUrl(link.shareUrl);
      setIsModalOpen(true);

      if (statusFilter === "active" || statusFilter === "all") {
        setAccessList((prev) => [mapCreatedShareLinkToView(link), ...prev]);
      }

      toast("Share link created", { variant: "success" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create share link";
      setCreateError(message);
      toast(message, { variant: "error" });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    const target = accessList.find((item) => item.id === id);
    if (!target || target.status !== "active") return;

    const confirmed = await confirm({
      title: "Revoke access?",
      description:
        "This will immediately remove access for this person. You can always create a new link later.",
      confirmText: "Revoke",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setRevokingId(id);
    try {
      await revokeShareLink({ shareId: id });
      setAccessList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "revoked" } : item,
        ),
      );
      toast("Access revoked", { variant: "success" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke access";
      toast(message, { variant: "error" });
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeViewer(accessId: string) {
    const target = viewerAccessList.find((item) => item.accessId === accessId);
    if (!target) return;

    const viewerName = target.user?.name || target.user?.email || "this viewer";

    const confirmed = await confirm({
      title: "Revoke access?",
      description: `This will immediately remove access for ${viewerName}. You can always share your profile again later.`,
      confirmText: "Revoke",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    setRevokingAccessId(accessId);
    try {
      await revokeCareAccess(accessId);
      setViewerAccessList((prev) =>
        prev.filter((item) => item.accessId !== accessId),
      );
      toast("Access revoked", { variant: "success" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke access";
      toast(message, { variant: "error" });
    } finally {
      setRevokingAccessId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Data Sharing</h1>
          <p className="mt-1 text-gray-600">
            Manage who can access your health data.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Who Has Access ({activeCount})
                </span>
                <span className="hidden text-xs text-gray-400 sm:inline">
                  Showing{" "}
                  {statusFilter && statusFilter !== "all"
                    ? `${statusFilter} links`
                    : "all links"}
                </span>
              </div>
              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter || "active"}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ShareStatusFilter)
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="all">All</option>
                <option value="revoked">Revoked</option>
                <option value="expired">Expired</option>
              </select>
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={isCreating}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Share profile"}
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading access list...
            </div>
          )}
          {!isLoading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {!isLoading && !error && accessList.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">
              No share links yet. Create a link to share your profile with
              someone you trust.
            </div>
          )}

          {!isLoading && !error && accessList.length > 0 && (
            <ShareList
              items={accessList}
              revokingId={revokingId}
              onRevoke={(id) => void handleRevoke(id)}
            />
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-1 text-gray-700">
            <h2 className="text-sm font-medium">People who can view my data</h2>
            <p className="text-xs text-gray-500">
              These users accepted a share link from you and can view your
              schedule as viewers.
            </p>
          </div>

          {isLoadingViewers && (
            <div className="py-6 text-center text-sm text-gray-500">
              Loading viewers...
            </div>
          )}

          {!isLoadingViewers && viewersError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {viewersError}
            </div>
          )}

          {!isLoadingViewers &&
            !viewersError &&
            viewerAccessList.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-500">
                No active viewers yet. When someone accepts your share link,
                they will appear here.
              </div>
            )}

          {!isLoadingViewers &&
            !viewersError &&
            viewerAccessList.length > 0 && (
              <div className="space-y-3">
                {viewerAccessList.map((access) => {
                  const displayName =
                    access.user?.name || access.user?.email || "Viewer";
                  const email = access.user?.email ?? "Unknown email";
                  const created = new Date(
                    access.grantedAt,
                  ).toLocaleDateString();

                  return (
                    <article
                      key={access.accessId}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {displayName}
                          </h3>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                            Viewer
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{email}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Access granted on {created}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <RevokeButton
                          onClick={() =>
                            void handleRevokeViewer(access.accessId)
                          }
                          loading={revokingAccessId === access.accessId}
                          disabled={revokingAccessId === access.accessId}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <CreateLinkModal
        open={isModalOpen}
        shareUrl={newShareUrl}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
