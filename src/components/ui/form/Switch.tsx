"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  id?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: { target: { checked: boolean; name?: string } }) => void;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      id,
      name,
      checked = false,
      disabled = false,
      onChange,
      onCheckedChange,
      label,
      description,
      size = "md",
      className,
      ...props
    },
    ref
  ) => {
    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      const nextChecked = !checked;
      onCheckedChange?.(nextChecked);
      onChange?.({
        target: {
          checked: nextChecked,
          name,
        },
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (disabled) return;
        const nextChecked = !checked;
        onCheckedChange?.(nextChecked);
        onChange?.({
          target: {
            checked: nextChecked,
            name,
          },
        });
      }
    };

    const trackSizes = {
      sm: "w-8 h-4.5 p-0.5",
      md: "w-11 h-6 p-0.5",
      lg: "w-14 h-7.5 p-1",
    };

    const thumbSizes = {
      sm: "w-3.5 h-3.5",
      md: "w-5 h-5",
      lg: "w-5.5 h-5.5",
    };

    const thumbTranslate = {
      sm: checked ? "translate-x-3.5" : "translate-x-0",
      md: checked ? "translate-x-5" : "translate-x-0",
      lg: checked ? "translate-x-6.5" : "translate-x-0",
    };

    return (
      <div
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center gap-3 cursor-pointer select-none group",
          disabled && "cursor-not-allowed opacity-50 pointer-events-none",
          className
        )}
      >
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
            checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700",
            trackSizes[size]
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out",
              thumbSizes[size],
              thumbTranslate[size]
            )}
          />
        </button>

        {name && (
          <input
            type="checkbox"
            name={name}
            checked={checked}
            readOnly
            className="sr-only"
            tabIndex={-1}
          />
        )}

        {(label || description) && (
          <div className="flex flex-col text-left">
            {label && (
              <span
                className={cn(
                  "text-xs font-semibold transition-colors",
                  checked
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                )}
              >
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
