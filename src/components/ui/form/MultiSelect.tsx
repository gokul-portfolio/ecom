"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectOption } from "./SelectInput";

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Type to search and select...",
  disabled = false,
  error,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options directly based on what user types in the input
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    const exists = value.includes(optionValue);
    const updated = exists
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(updated);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const removeTag = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(value.filter((v) => v !== optionValue));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace" && !searchQuery && value.length > 0) {
      // Remove last tag when backspacing on empty input
      onChange?.(value.slice(0, -1));
      return;
    }

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        toggleOption(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const selectedLabels = options.filter((opt) => value.includes(opt.value));

  return (
    <div ref={containerRef} className={cn("relative w-full text-left", className)}>
      {/* MultiSelect Box with Embedded Tags + Direct Inline Input */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={cn(
          "min-h-10 px-3 py-1.5 rounded-md border transition-all flex items-center justify-between gap-2 cursor-text",
          "bg-white dark:bg-slate-900 font-medium",
          error
            ? "border-rose-500 ring-rose-500/20 ring-2"
            : isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
        )}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
          {/* Selected Tag Badges */}
          {selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => removeTag(e, opt.value)}
                className="hover:text-indigo-900 dark:hover:text-white rounded-full p-0.5 cursor-pointer"
                title={`Remove ${opt.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Direct typing input inside the same field! */}
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={searchQuery}
            placeholder={selectedLabels.length === 0 ? placeholder : "Add more..."}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-[120px] bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none py-1"
          />
        </div>

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
            )}
          />
        </button>
      </div>

      {/* Filtered Dropdown Options Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching options found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = value.includes(opt.value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors",
                    isSelected
                      ? "text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40"
                      : isHighlighted
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                      : "text-slate-700 dark:text-slate-200",
                    opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
