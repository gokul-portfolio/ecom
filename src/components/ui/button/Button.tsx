import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success"
  | "warning"
  | "link"
  | "gradient";

export type ButtonSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "icon"
  | "icon-sm"
  | "icon-lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      icon,
      fullWidth = false,
      rounded = false,
      children,
      className,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles with accessibility and focus states
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    // Size mappings with reduced, crisp border-radius (rounded-md / rounded-sm)
    const sizeStyles: Record<ButtonSize, string> = {
      xs: "text-xs px-2.5 py-1 gap-1.5 h-7 rounded-sm",
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8 rounded-md",
      md: "text-sm px-4 py-2 gap-2 h-9.5 rounded-md",
      lg: "text-sm px-5 py-2.5 gap-2.5 h-11 rounded-md font-semibold",
      xl: "text-base px-6 py-3 gap-3 h-12.5 rounded-md font-semibold",
      icon: "w-9.5 h-9.5 p-0 rounded-md justify-center",
      "icon-sm": "w-8 h-8 p-0 rounded-sm justify-center text-xs",
      "icon-lg": "w-11 h-11 p-0 rounded-md justify-center text-base",
    };

    // Variant mappings (light and dark mode supported)
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 font-semibold",
      secondary:
        "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
      outline:
        "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs",
      ghost:
        "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white",
      destructive:
        "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs dark:bg-rose-600 dark:hover:bg-rose-500",
      success:
        "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs dark:bg-emerald-600 dark:hover:bg-emerald-500",
      warning:
        "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs",
      link:
        "bg-transparent text-amber-600 dark:text-amber-400 hover:underline p-0 h-auto shadow-none font-medium",
      gradient:
        "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-md shadow-amber-600/20 active:opacity-95 font-semibold",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        suppressHydrationWarning
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          rounded && "rounded-full",
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        )}
        {!loading && icon ? (
          icon
        ) : (
          <>
            {!loading && leftIcon && (
              <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
            )}
            {children}
            {!loading && rightIcon && (
              <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
