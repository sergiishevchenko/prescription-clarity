"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useConfirm, useToast } from "@/components/shared/ToastProvider";

export default function DeleteMedicationButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  async function onDelete() {
    const ok = await confirm({
      title: "Delete medication",
      description:
        "This will delete the medication and remove all future scheduled doses. Past completed entries will be preserved for your history.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Delete failed");
      onDeleted?.();
      toast("Medication and future schedules deleted", { variant: "success" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="cursor-pointer border-red-300 text-red-600 hover:bg-red-50"
      onClick={onDelete}
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
