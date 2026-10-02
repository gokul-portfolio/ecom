"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, X, ChevronDown } from "lucide-react";
import { cn, formatTime12H, parseTimeString } from "@/lib/utils";

export interface TimePickerProps {
  value?: string; // Format: "hh:mm A" e.g. "09:30 AM"
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
}

export function TimePicker({
  value = "",
  onChange,
  placeholder = "Select time...",
  disabled = false,
  error,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"hour" | "minute">("hour");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse time safely
  const parsed = parseTimeString(value);
  const [selectedHour, setSelectedHour] = useState<number>(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const p = parseTimeString(value);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setSelectedPeriod(p.period);
    }
  }, [value]);

  const emitTime = (hour: number, minute: number, period: "AM" | "PM") => {
    const formatted = formatTime12H(hour, minute, period);
    onChange?.(formatted);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    emitTime(h, selectedMinute, selectedPeriod);
    // Automatically switch to minute selection for smooth workflow
    setActiveTab("minute");
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
    emitTime(selectedHour, m, selectedPeriod);
  };

  const handlePeriodToggle = (p: "AM" | "PM") => {
    setSelectedPeriod(p);
    emitTime(selectedHour, selectedMinute, p);
  };

  const handleNow = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const period: "AM" | "PM" = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    // Round minute to nearest 5
    const roundedMin = Math.round(minutes / 5) * 5 % 60;

    setSelectedHour(hours);
    setSelectedMinute(roundedMin);
    setSelectedPeriod(period);
    emitTime(hours, roundedMin, period);
  };

  const clearTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {/* Time Trigger Input */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
        className={cn(
          "w-full h-10 px-3.5 rounded-md border transition-all flex items-center justify-between cursor-pointer select-none font-medium",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
          error
            ? "border-rose-500 ring-2 ring-rose-500/20"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          {value ? (
            <span className="text-xs font-semibold font-mono tracking-wide">{value}</span>
          ) : (
            <span className="text-xs text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={clearTime}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              title="Clear time"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
            )}
          />
        </div>
      </div>

      {/* Clean User-Friendly Time Picker Popup (No ugly scrollbars!) */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 w-76 animate-in fade-in-0 zoom-in-95 duration-100 space-y-3.5">
          {/* Digital Time Header Display */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
            {/* Hour & Minute Switcher */}
            <div className="flex items-center gap-1 font-mono text-xl font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("hour")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  activeTab === "hour"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {pad(selectedHour)}
              </button>
              <span className="text-slate-400 animate-pulse">:</span>
              <button
                type="button"
                onClick={() => setActiveTab("minute")}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  activeTab === "minute"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {pad(selectedMinute)}
              </button>
            </div>

            {/* AM / PM Segmented Switcher */}
            <div className="flex items-center p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => handlePeriodToggle("AM")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  selectedPeriod === "AM"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle("PM")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                  selectedPeriod === "PM"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Section Indicator */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
              Select {activeTab === "hour" ? "Hour (1 - 12)" : "Minute (00 - 55)"}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("hour")}
                className={cn(
                  "px-2 py-0.5 rounded cursor-pointer",
                  activeTab === "hour" ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60" : "text-slate-400"
                )}
              >
                Hour
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("minute")}
                className={cn(
                  "px-2 py-0.5 rounded cursor-pointer",
                  activeTab === "minute" ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60" : "text-slate-400"
                )}
              >
                Min
              </button>
            </div>
          </div>

          {/* Clean 4x3 Grid (NO SCROLLBARS! 1-click selection!) */}
          {activeTab === "hour" ? (
            <div className="grid grid-cols-4 gap-1.5">
              {hours.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={cn(
                      "h-9 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {pad(h)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {minutes.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={cn(
                      "h-9 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer",
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-slate-100 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {pad(m)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Presets & Done Bar */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleNow}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Current Time
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
