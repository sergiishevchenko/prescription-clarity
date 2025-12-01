"use client";

type RevokeButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function RevokeButton({
  disabled,
  loading,
  onClick,
}: RevokeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Revoking..." : "Revoke"}
    </button>
  );
}
