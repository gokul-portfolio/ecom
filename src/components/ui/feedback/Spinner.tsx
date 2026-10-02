import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin text-indigo-600 dark:text-indigo-400",
        sizeClasses[size],
        className
      )}
    />
  );
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function Skeleton({
  rounded = "md",
  className,
  ...props
}: SkeletonProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-xl",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/70 dark:bg-slate-800",
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
}

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showValue = false,
  size = "md",
  variant = "primary",
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantColors = {
    primary: "bg-indigo-600 dark:bg-indigo-500",
    success: "bg-emerald-600 dark:bg-emerald-500",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-600 dark:bg-rose-500",
  };

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showValue && (
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden",
          heightClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
