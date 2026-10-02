import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      size = "md",
      rounded,
      error,
      leftIcon,
      rightIcon,
      disabled,
      type = "text",
      ...props
    },
    ref
  ) => {
    const roundedMap = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    };

    const hasCustomRounded = className && /rounded(-\w+)?/.test(className);
    const defaultRounded = size === "sm" ? "rounded-sm" : size === "lg" ? "rounded-lg" : "rounded-md";
    const resolvedRounded = rounded ? roundedMap[rounded] : hasCustomRounded ? "" : defaultRounded;

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs",
      md: "h-10 px-3.5 text-sm",
      lg: "h-12 px-4 text-base",
    };

    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(
            "w-full transition-colors font-medium",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            "border placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2",
            error
              ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
              : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 dark:focus:border-indigo-400",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
            leftIcon ? (size === "sm" ? "pl-8" : size === "lg" ? "pl-11" : "pl-10") : "",
            rightIcon ? (size === "sm" ? "pr-8" : size === "lg" ? "pr-11" : "pr-10") : "",
            sizeClasses[size],
            resolvedRounded,
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-slate-400 dark:text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";
