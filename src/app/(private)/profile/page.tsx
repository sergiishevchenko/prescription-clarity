"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  dateOfBirth: string | null;
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="8" y="14" width="3" height="3" rx="0.5" />
    </svg>
  );
}

export default function ProfilePage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data = (await res.json()) as { user: Profile };
        if (!isMounted) return;
        setName(data.user.name ?? "");
        setEmail(data.user.email);
        setDateOfBirth(
          data.user.dateOfBirth
            ? data.user.dateOfBirth.slice(0, 10) // YYYY-MM-DD for date input
            : "",
        );
      } catch {
        if (!isMounted) return;
        setError("Unable to load profile. Please try again.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : "",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save changes");
      }
      await res.json();
      setMessage("Profile updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Profile
        </h1>
        <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
          Manage your account settings and personal information.
        </p>

        <div className="mt-6 rounded-lg bg-white shadow sm:mt-8">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <h3 className="text-base font-medium text-gray-900 sm:text-lg sm:leading-6">
              Personal Information
            </h3>

            {loading ? (
              <p className="mt-4 text-sm text-gray-600 sm:mt-6 sm:text-base">
                Loading...
              </p>
            ) : (
              <form className="mt-4 sm:mt-6" onSubmit={onSubmit} noValidate>
                <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-6 sm:gap-y-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-900 sm:text-base"
                    >
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="name"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:px-3.5 sm:py-2.5 sm:text-base"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-900 sm:text-base"
                    >
                      Email Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:px-3.5 sm:py-2.5 sm:text-base"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-sm font-medium text-gray-900 sm:text-base"
                    >
                      Date of Birth
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="date"
                        id="dateOfBirth"
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:py-2.5 sm:pr-12 sm:pl-3.5 sm:text-base"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        disabled={saving}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  {message && (
                    <span className="text-xs text-green-700 sm:text-sm">
                      {message}
                    </span>
                  )}
                  {error && (
                    <span className="text-xs text-red-600 sm:text-sm">
                      {error}
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
