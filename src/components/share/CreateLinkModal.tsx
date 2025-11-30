"use client";

import { useToast } from "@/components/shared/ToastProvider";

export type CreateLinkModalProps = {
  open: boolean;
  shareUrl: string | null;
  onClose: () => void;
};

export function CreateLinkModal({
  open,
  shareUrl,
  onClose,
}: CreateLinkModalProps) {
  const toast = useToast();

  if (!open || !shareUrl) return null;

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Share link copied to clipboard", { variant: "success" });
    } catch {
      toast("Failed to copy link", { variant: "error" });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-link-title"
      className="fixed inset-0 z-[70] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h2
          id="share-link-title"
          className="text-lg font-semibold text-gray-900"
        >
          Share your profile
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Send this link to a caregiver or doctor you trust. They will be able
          to view your medication schedule after accepting the invitation.
        </p>
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-medium text-gray-500">
            Share link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 truncate rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Copy
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
