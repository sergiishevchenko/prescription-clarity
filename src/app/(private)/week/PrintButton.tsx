"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import styles from "./week.module.css";

type PrintButtonProps = {
  weekStart: Date;
  weekEnd: Date;
  timezone: string;
};

function PrintIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        style={{ opacity: 0.25 }}
      />
      <path
        fill="currentColor"
        style={{ opacity: 0.75 }}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function PrintButton({
  weekStart,
  weekEnd,
  timezone,
}: PrintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const showToast = useToast();

  // Fetch user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load user profile");
        }
        const data = (await res.json()) as { user: { id: string } };
        setUserId(data.user.id);
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
        showToast("Failed to load user profile", { variant: "error" });
      }
    }
    void fetchUserId();
  }, [showToast]);

  const handlePrint = async () => {
    if (!userId) {
      showToast("User profile not loaded. Please try again.", {
        variant: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Format dates as ISO strings
      // Create UTC dates at start of day (from) and end of day (to)
      const fromDate = new Date(
        Date.UTC(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate(),
          0,
          0,
          0,
          0,
        ),
      );
      const fromISO = fromDate.toISOString();

      const toDate = new Date(
        Date.UTC(
          weekEnd.getFullYear(),
          weekEnd.getMonth(),
          weekEnd.getDate(),
          23,
          59,
          59,
          999,
        ),
      );
      const toISO = toDate.toISOString();

      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          from: fromISO,
          to: toISO,
          tz: timezone,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          error: "Unknown error",
        }))) as { error?: string };
        throw new Error(errorData.error || "Failed to export PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fromDateStr = `${fromDate.getUTCFullYear()}-${String(fromDate.getUTCMonth() + 1).padStart(2, "0")}-${String(fromDate.getUTCDate()).padStart(2, "0")}`;
      const toDateStr = `${toDate.getUTCFullYear()}-${String(toDate.getUTCMonth() + 1).padStart(2, "0")}-${String(toDate.getUTCDate()).padStart(2, "0")}`;
      a.download = `schedule-${fromDateStr}-${toDateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast("PDF exported successfully", { variant: "success" });
    } catch (error) {
      console.error("PDF export error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to export PDF";
      showToast(message, { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loaderContainer}>
          <Spinner className={styles.spinner} />
        </div>
      )}
      <button
        type="button"
        className={styles.printButton}
        aria-label="Print week schedule"
        onClick={handlePrint}
        disabled={isLoading || !userId}
      >
        <PrintIcon className={styles.printIcon} />
        <span className={styles.printText}>Print</span>
      </button>
    </>
  );
}
