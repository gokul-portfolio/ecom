"use client";

import React, { forwardRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  size?: "sm" | "md" | "lg";
  error?: boolean | string;
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  onChange?: (val: number) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      size = "md",
      error,
      min = 0,
      max = 999999,
      step = 1,
      value = 0,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const numVal = typeof value === "number" ? value : parseFloat(value as string) || 0;

    const handleIncrement = () => {
      if (disabled) return;
      const next = Math.min(max, numVal + step);
      onChange?.(next);
    };

    const handleDecrement = () => {
      if (disabled) return;
      const next = Math.max(min, numVal - step);
      onChange?.(next);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (isNaN(val)) {
        onChange?.(0);
      } else {
        onChange?.(Math.min(max, Math.max(min, val)));
      }
    };

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs rounded-md",
      md: "h-10 px-3.5 text-sm rounded-lg",
      lg: "h-12 px-4 text-base rounded-xl",
    };

    return (
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            "w-full transition-colors font-medium pr-8",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            "border placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            error
              ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500"
              : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/20 dark:focus:border-indigo-400",
            disabled &&
              "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
            sizeClasses[size],
            className
          )}
          {...props}
        />
        <div className="absolute right-1 flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 pl-1">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || numVal >= max}
            tabIndex={-1}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || numVal <= min}
            tabIndex={-1}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";
