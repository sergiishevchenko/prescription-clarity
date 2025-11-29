"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  showToast: (
    message: string,
    opts?: { variant?: ToastVariant; duration?: number },
  ) => void;
  confirm: (opts: {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
  }) => Promise<boolean>;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}

export function useConfirm() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useConfirm must be used within ToastProvider");
  return ctx.confirm;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);
  const [confirmText, setConfirmText] = useState("Delete");
  const [cancelText, setCancelText] = useState("Cancel");
  const [title, setTitle] = useState("Are you sure?");
  const [description, setDescription] = useState<string | undefined>(undefined);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    (message, opts) => {
      const id = idRef.current++;
      const item: ToastItem = {
        id,
        message,
        variant: opts?.variant ?? "info",
        duration: opts?.duration ?? 3000,
      };
      setToasts((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  const confirm = useCallback<ToastContextValue["confirm"]>(
    ({ title, description, confirmText, cancelText }) => {
      setTitle(title || "Are you sure?");
      setDescription(description);
      setConfirmText(confirmText || "Confirm");
      setCancelText(cancelText || "Cancel");
      setOpen(true);
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [],
  );

  const onConfirm = () => {
    setOpen(false);
    resolverRef.current?.(true);
  };
  const onCancel = () => {
    setOpen(false);
    resolverRef.current?.(false);
  };

  // ESC key closes dialog
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo<ToastContextValue>(
    () => ({ showToast, confirm }),
    [showToast, confirm],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed top-[72px] right-0 left-0 z-[60] flex items-start justify-center p-4 sm:inset-0 sm:top-0 sm:justify-end sm:p-6"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto overflow-hidden rounded-lg border shadow-md transition-all ${
                t.variant === "success"
                  ? "border-green-200 bg-white"
                  : t.variant === "error"
                    ? "border-red-200 bg-white"
                    : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`mt-1 h-2 w-2 flex-none rounded-full ${t.variant === "success" ? "bg-green-500" : t.variant === "error" ? "bg-red-500" : "bg-gray-400"}`}
                />
                <div className="flex-1 text-sm text-gray-800">{t.message}</div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm dialog */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-[70] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-gray-600">{description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500/50 focus:outline-none"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
