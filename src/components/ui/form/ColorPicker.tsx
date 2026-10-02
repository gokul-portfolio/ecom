"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  presets?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PRESETS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#0f172a", // Slate Dark
  "#64748b", // Slate Muted
  "#ffffff", // White
];

export function ColorPicker({
  value = "#6366f1",
  onChange,
  presets = DEFAULT_PRESETS,
  disabled,
  className,
}: ColorPickerProps) {
  const [internalColor, setInternalColor] = useState(value);

  const handleColorChange = (newColor: string) => {
    if (disabled) return;
    setInternalColor(newColor);
    onChange?.(newColor);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value || internalColor}
            disabled={disabled}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800 p-0.5 bg-transparent"
          />
        </div>
        <input
          type="text"
          value={value || internalColor}
          disabled={disabled}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#000000"
          className="w-28 h-10 px-3 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((color) => {
          const isSelected = (value || internalColor).toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => handleColorChange(color)}
              className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center transition-transform hover:scale-110",
                isSelected
                  ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900"
                  : "border-slate-200 dark:border-slate-800"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "w-3.5 h-3.5",
                    color === "#ffffff" ? "text-slate-900" : "text-white"
                  )}
                  strokeWidth={3}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
