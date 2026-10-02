"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  safeParseDate,
  formatDate,
  formatDisplayDate,
  getCalendarGrid,
  getDatePreset,
  MONTH_NAMES,
  DAYS_OF_WEEK,
} from "@/lib/utils";

export interface DatePickerProps {
  value?: string | Date;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  disabled = false,
  error,
  className,
  minYear = 1950,
  maxYear = 2050,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize selected date safely
  const parsedDate = safeParseDate(value);
  const initialDate = parsedDate || new Date();

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync year and month if value changes
  useEffect(() => {
    if (parsedDate) {
      setCurrentYear(parsedDate.getFullYear());
      setCurrentMonth(parsedDate.getMonth());
    }
  }, [value]);

  // Year options list
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear]);

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dateString: string) => {
    if (disabled) return;
    onChange?.(dateString);
    setIsOpen(false);
  };

  const handleToday = () => {
    const todayStr = getDatePreset("today");
    const d = safeParseDate(todayStr);
    if (d) {
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
    onChange?.(todayStr);
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const valueString = formatDate(value);
  const calendarDays = getCalendarGrid(currentYear, currentMonth, valueString);

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {/* Date Trigger Input */}
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
          "w-full h-10 px-3.5 rounded-md border transition-all flex items-center justify-between cursor-pointer select-none",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium",
          error
            ? "border-rose-500 ring-2 ring-rose-500/20"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
        )}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
          {valueString ? (
            <span className="text-xs font-semibold truncate">
              {formatDisplayDate(valueString)}
            </span>
          ) : (
            <span className="text-xs text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {valueString && !disabled && (
            <button
              type="button"
              onClick={clearDate}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              title="Clear date"
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

      {/* Clean, Modern Calendar Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 mt-2 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 w-76 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Clean, Single-Row Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* Prev Month */}
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <div className="relative">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                  className="h-8 pl-2.5 pr-6 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>

              {/* Year Select */}
              <div className="relative">
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                  className="h-8 pl-2.5 pr-6 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Next Month */}
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
            {DAYS_OF_WEEK.map((d) => (
              <span
                key={d}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid (42 cells) */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item) => (
              <button
                key={item.dateString}
                type="button"
                onClick={() => handleSelectDay(item.dateString)}
                className={cn(
                  "h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all mx-auto cursor-pointer",
                  !item.isCurrentMonth && "text-slate-300 dark:text-slate-600 opacity-40",
                  item.isCurrentMonth && "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                  item.isToday && !item.isSelected && "border border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold",
                  item.isSelected && "bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xs"
                )}
              >
                {item.dayNumber}
              </button>
            ))}
          </div>

          {/* Clean Footer Bar with Today and Clear */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
            >
              Today
            </button>
            {valueString && (
              <button
                type="button"
                onClick={() => onChange?.("")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
