import React from "react";
import { cn } from "@/lib/utils";

export type LoaderVariant = "spinner" | "dots" | "pulse" | "bar" | "brand";
export type LoaderSize = "sm" | "md" | "lg" | "xl";

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  text?: React.ReactNode;
  fullscreen?: boolean;
  className?: string;
}

export function Loader({
  variant = "spinner",
  size = "md",
  text,
  fullscreen = false,
  className,
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-9 h-9",
    xl: "w-12 h-12",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
    xl: "w-4.5 h-4.5",
  };

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]",
                dotSizes[size]
              )}
            />
            <span
              className={cn(
                "rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]",
                dotSizes[size]
              )}
            />
            <span
              className={cn(
                "rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce",
                dotSizes[size]
              )}
            />
          </div>
        );

      case "pulse":
        return (
          <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3/4 w-3/4 bg-indigo-600 dark:bg-indigo-500 shadow-md" />
          </div>
        );

      case "bar":
        return (
          <div className="w-36 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 bg-indigo-600 dark:bg-indigo-500 rounded-full w-1/2 animate-[indeterminate_1.5s_infinite_ease-in-out]" />
          </div>
        );

      case "brand":
        return (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-amber-500 p-0.5 shadow-xl animate-spin duration-3000">
                <div className="w-full h-full bg-white dark:bg-[#0c1322] rounded-2xl flex items-center justify-center" />
              </div>
              <span className="absolute font-black text-xs text-indigo-600 dark:text-indigo-400 tracking-tighter">
                NC
              </span>
            </div>
          </div>
        );

      case "spinner":
      default:
        return (
          <svg
            className={cn("animate-spin text-indigo-600 dark:text-indigo-400", sizeClasses[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-90"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
    }
  };

  const content = (
    <div className={cn("inline-flex flex-col items-center justify-center gap-2.5", className)}>
      {renderLoader()}
      {text && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
        <div className="p-8 rounded-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center gap-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
