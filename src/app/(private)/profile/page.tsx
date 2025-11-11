"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
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
        setProfile(data.user);
        setName(data.user.name ?? "");
        setEmail(data.user.email);
      } catch (e) {
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
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save changes");
      }
      const data = (await res.json()) as { user: Profile };
      setProfile(data.user);
      setMessage("Profile updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and personal information.
        </p>

        <div className="mt-8 rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Personal Information
            </h3>

            {loading ? (
              <p className="mt-6 text-gray-600">Loading...</p>
            ) : (
              <form className="mt-6" onSubmit={onSubmit} noValidate>
                <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="name"
                      className="block text-base font-medium text-gray-900"
                    >
                      Full Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="name"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:text-base"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="email"
                      className="block text-base font-medium text-gray-900"
                    >
                      Email Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="email"
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none sm:text-base"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    type="submit"
                    className="inline-flex cursor-pointer justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  {message && (
                    <span className="text-sm text-green-700">{message}</span>
                  )}
                  {error && (
                    <span className="text-sm text-red-600">{error}</span>
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
