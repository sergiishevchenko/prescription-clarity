"use client";

import { HelpTooltip } from "@/components/shared/HelpTooltip";

type FormLabelProps = {
  htmlFor?: string;
  required?: boolean;
  tooltip?: React.ReactNode;
  tooltipPlacement?: "top" | "bottom";
  children: React.ReactNode;
};

export function FormLabel({
  htmlFor,
  required = false,
  tooltip,
  tooltipPlacement = "top",
  children,
}: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[14px] font-medium text-gray-700 mb-2"
    >
      <span className="flex items-center gap-1.5">
        {children}
        {required && (
          <span className="text-red-500 text-[14px] font-medium leading-none">
            *
          </span>
        )}
        {tooltip && (
          <HelpTooltip placement={tooltipPlacement}>{tooltip}</HelpTooltip>
        )}
      </span>
    </label>
  );
}

