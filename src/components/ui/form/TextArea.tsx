import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  showCount?: boolean;
  maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      error,
      showCount,
      maxLength,
      value,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full relative">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          rows={rows}
          disabled={disabled}
          className={cn(
            "w-full px-3.5 py-2.5 text-sm rounded-lg transition-colors font-medium resize-y",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            "border placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2",
            error
              ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
              : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 dark:focus:border-indigo-400",
            disabled &&
              "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
