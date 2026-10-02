import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export function Badge({
  variant = "primary",
  size = "md",
  rounded = false,
  leftIcon,
  children,
  className,
  pulse = false,
}: BadgeProps) {
  const variantStyles = {
    primary:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 shadow-xs",
    secondary:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700/80 shadow-xs",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-xs",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 shadow-xs",
    danger:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 shadow-xs",
    info:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 shadow-xs",
    outline:
      "bg-transparent text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    md: "px-3.5 py-1.5 text-xs font-bold gap-2 tracking-wide",
    lg: "px-4.5 py-2 text-sm font-bold gap-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border transition-all duration-200 select-none",
        rounded ? "rounded-full" : "rounded-lg",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {!pulse && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
    </span>
  );
}

export interface StatusBadgeProps {
  status:
    | "Paid"
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Refunded"
    | "In Stock"
    | "Low Stock"
    | "Out of Stock"
    | string;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let variant: BadgeVariant = "secondary";
  let pulse = false;

  if (
    normalized.includes("paid") ||
    normalized.includes("delivered") ||
    normalized.includes("in stock")
  ) {
    variant = "success";
    pulse = true;
  } else if (
    normalized.includes("pending") ||
    normalized.includes("processing") ||
    normalized.includes("low stock")
  ) {
    variant = "warning";
    pulse = true;
  } else if (
    normalized.includes("cancelled") ||
    normalized.includes("out of stock")
  ) {
    variant = "danger";
    pulse = false;
  } else if (
    normalized.includes("shipped") ||
    normalized.includes("refunded")
  ) {
    variant = "info";
    pulse = false;
  }

  return (
    <Badge
      variant={variant}
      rounded
      size={size}
      pulse={pulse}
      className={cn("capitalize tracking-normal", className)}
      leftIcon={!pulse ? <span className="w-1.5 h-1.5 rounded-full bg-current" /> : undefined}
    >
      {status}
    </Badge>
  );
}
