"use client";

import React, { forwardRef } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlugInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  prefix?: string;
  value?: string;
  onChange?: (val: string) => void;
  onAutoGenerate?: () => void;
  error?: boolean | string;
}

export const SlugInput = forwardRef<HTMLInputElement, SlugInputProps>(
  (
    {
      prefix = "https://store.com/products/",
      value = "",
      onChange,
      onAutoGenerate,
      error,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Auto-format slug: lowercase, replace spaces with hyphens, remove invalid characters
      const cleanSlug = e.target.value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      onChange?.(cleanSlug);
    };

    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <div className="h-10 px-3 flex items-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-lg select-none shrink-0 max-w-[200px] truncate">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          onChange={handleTextChange}
          placeholder="product-url-slug"
          className={cn(
            "w-full h-10 px-3 text-xs font-mono font-medium transition-colors",
            prefix ? "rounded-r-lg" : "rounded-lg",
            "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
            "border",
            error
              ? "border-rose-500 focus:ring-rose-500/20"
              : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
            onAutoGenerate && "pr-9",
            className
          )}
          {...props}
        />
        {onAutoGenerate && (
          <button
            type="button"
            onClick={onAutoGenerate}
            disabled={disabled}
            title="Auto generate slug from title"
            className="absolute right-2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SlugInput.displayName = "SlugInput";
