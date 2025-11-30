"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ShareValidationState =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | {
      status: "valid";
      ownerName: string | null;
      ownerEmail: string;
    };

type AcceptState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ShareAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [validation, setValidation] = useState<ShareValidationState>(
    token
      ? { status: "loading" }
      : { status: "invalid", message: "Missing token in link." },
  );
  const [accept, setAccept] = useState<AcceptState>({ status: "idle" });

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function validate() {
      setValidation({ status: "loading" });
      try {
        const res = await fetch(
          `/api/share/validate?token=${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          },
        );

        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || data.valid === false) {
          const message =
            data?.error ||
            (res.status === 404
              ? "This link is not valid."
              : "Unable to validate this link.");
          setValidation({ status: "invalid", message });
          return;
        }

        const owner = data.shareLink?.owner;
        setValidation({
          status: "valid",
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? "Unknown user",
        });
      } catch {
        if (cancelled) return;
        setValidation({
          status: "invalid",
          message: "Unable to validate this link. Please try again later.",
        });
      }
    }

    void validate();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAccept() {
    if (!token || accept.status === "submitting") return;

    setAccept({ status: "submitting" });
    try {
      const res = await fetch("/api/share/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAccept({
          status: "error",
          message:
            "You need to be logged in to accept this link. Please sign in and open the link again.",
        });
        return;
      }

      if (!res.ok) {
        const message =
          data?.error || "Failed to accept share link. Please try again.";
        setAccept({ status: "error", message });
        return;
      }

      const alreadyExists = data?.alreadyExists === true;
      setAccept({
        status: "success",
        message: alreadyExists
          ? "You already have access to this profile."
          : "Access granted. You can now view this profile in your dashboard.",
      });
    } catch {
      setAccept({
        status: "error",
        message: "Something went wrong while accepting the link.",
      });
    }
  }

  const isValid = validation.status === "valid";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white px-6 py-8 shadow-md">
        <h1 className="text-2xl font-semibold text-gray-900">
          Accept shared profile
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Someone has shared their medication profile with you. Accepting this
          invitation will let you view their schedule and related data.
        </p>

        <div className="mt-6 space-y-4">
          {validation.status === "loading" && (
            <p className="text-sm text-gray-500">Validating link…</p>
          )}

          {validation.status === "invalid" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validation.message}
            </div>
          )}

          {isValid && (
            <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-sm text-gray-700">
                You are about to accept access to:
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {validation.ownerName || validation.ownerEmail}
              </p>
              {validation.ownerName && (
                <p className="text-xs text-gray-500">{validation.ownerEmail}</p>
              )}
            </div>
          )}

          {accept.status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {accept.message}
            </div>
          )}

          {accept.status === "success" && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p>{accept.message}</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Go to dashboard
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!isValid || accept.status === "submitting"}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {accept.status === "submitting" ? "Accepting..." : "Accept access"}
          </button>
        </div>
      </div>
    </div>
  );
}
