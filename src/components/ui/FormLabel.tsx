"use client";

import { Tooltip } from "./Tooltip";

type FormLabelProps = {
  htmlFor?: string;
  required?: boolean;
  tooltip?: React.ReactNode;
  children: React.ReactNode;
};

export function FormLabel({
  htmlFor,
  required = false,
  tooltip,
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
          <Tooltip content={tooltip}>
            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs hover:bg-gray-300 transition-colors cursor-help">
              ?
            </span>
          </Tooltip>
        )}
      </span>
    </label>
  );
}

