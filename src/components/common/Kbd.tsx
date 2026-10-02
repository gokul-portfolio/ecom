"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KbdProps {
  keys: string[];
  className?: string;
  size?: "xs" | "sm" | "md";
}

export function Kbd({ keys, className, size = "sm" }: KbdProps) {
  const sizeStyles = {
    xs: "px-1 py-0.5 text-[9px] min-w-4",
    sm: "px-1.5 py-0.5 text-[10px] min-w-5",
    md: "px-2 py-1 text-xs min-w-6",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 font-mono select-none", className)}>
      {keys.map((k, idx) => (
        <React.Fragment key={idx}>
          {k === "or" ? (
            <span className="text-[10px] text-slate-400 font-sans px-0.5">or</span>
          ) : (
            <kbd
              className={cn(
                "inline-flex items-center justify-center font-semibold rounded shadow-2xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors",
                sizeStyles[size]
              )}
            >
              {k}
            </kbd>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}
