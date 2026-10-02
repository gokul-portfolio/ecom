import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "outline" | "solid";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const sizeStyles = {
      sm: "w-8 h-8 text-xs",
      md: "w-9 h-9 text-sm",
      lg: "w-10 h-10 text-base",
    };

    const variantStyles = {
      ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
      outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      solid: "bg-slate-900 text-white hover:bg-slate-800",
    };

    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
