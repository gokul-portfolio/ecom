import React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (val: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  orientation = "vertical",
  className,
  disabled,
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "gap-3",
        orientation === "horizontal" ? "flex flex-wrap items-center" : "flex flex-col",
        className
      )}
    >
      {options.map((opt) => {
        const isChecked = value === opt.value;
        const isDisabled = disabled || opt.disabled;
        const id = `${name}-${opt.value}`;

        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={cn(
              "inline-flex items-start gap-2.5 cursor-pointer select-none group",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                id={id}
                name={name}
                type="radio"
                value={opt.value}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => !isDisabled && onChange?.(opt.value)}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900",
                  "peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500",
                  "peer-focus:ring-2 peer-focus:ring-indigo-500/20"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-transform duration-150",
                    isChecked ? "scale-100" : "scale-0"
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {opt.description}
                </span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
