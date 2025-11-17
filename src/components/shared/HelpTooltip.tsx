"use client";

import type { ReactNode } from "react";

type HelpTooltipProps = {
  children: ReactNode;
  className?: string;
  placement?: "top" | "bottom";
};

export function HelpTooltip({
  children,
  className,
  placement = "top",
}: HelpTooltipProps) {
  const wrapperClass = [
    "relative inline-flex items-center group",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const positionClass =
    placement === "bottom" ? "top-full mt-3" : "bottom-full mb-3";

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-500 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        aria-label="Show help"
      >
        ?
      </button>
      <div
        className={`pointer-events-none invisible absolute left-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl bg-[#071023] px-6 py-4 text-sm text-white opacity-0 shadow-2xl transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${positionClass}`}
      >
        {children}
      </div>
    </div>
  );
}
