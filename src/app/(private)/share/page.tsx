"use client";

import { useState } from "react";

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

export default function DataSharingPage() {
  const [accessList, setAccessList] = useState<ShareAccess[]>(
    INITIAL_ACCESS_LIST,
  );

  const handleRevoke = (id: string) => {
    setAccessList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "revoked" } : item,
      ),
    );
  };

  const activeCount = accessList.filter((item) => item.status === "active")
    .length;

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
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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

