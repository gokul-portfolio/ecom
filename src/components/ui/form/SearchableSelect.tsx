"use client";

import React, { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  group?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  clearable?: boolean;
  error?: boolean | string;
  className?: string;
  emptyText?: string;
  maxDropdownHeight?: string;
}

export const SearchableSelect = forwardRef<HTMLDivElement, SearchableSelectProps>(
  (
    {
      options,
      value = "",
      onChange,
      placeholder = "Select an option...",
      searchPlaceholder = "Type to search...",
      size = "md",
      disabled = false,
      clearable = true,
      error,
      className,
      emptyText = "No matching options found",
      maxDropdownHeight = "max-h-60",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Find currently selected option
    const selectedOption = useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value]
    );

    // Filter options in real-time as user types
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase().trim();
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.description && opt.description.toLowerCase().includes(q)) ||
          (opt.group && opt.group.toLowerCase().includes(q))
      );
    }, [options, searchQuery]);

    // Group options if group is present
    const groupedOptions = useMemo(() => {
      const hasGroups = options.some((opt) => opt.group);
      if (!hasGroups) return null;

      const groups: Record<string, SearchableSelectOption[]> = {};
      for (const opt of filteredOptions) {
        const g = opt.group || "Other";
        if (!groups[g]) groups[g] = [];
        groups[g].push(opt);
      }
      return groups;
    }, [options, filteredOptions]);

    // Handle outside click & escape key
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === "Escape") {
          setIsOpen(false);
          setSearchQuery("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    // Auto-focus search input on open
    useEffect(() => {
      if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setHighlightedIndex(0);
      }
    }, [isOpen]);

    // Keyboard navigation within filtered list
    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
      }
    };

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.("");
      setSearchQuery("");
    };

    // Helper to highlight matching text in labels
    const highlightMatch = (text: string, query: string) => {
      if (!query.trim()) return text;
      const index = text.toLowerCase().indexOf(query.toLowerCase());
      if (index === -1) return text;
      const before = text.slice(0, index);
      const match = text.slice(index, index + query.length);
      const after = text.slice(index + query.length);
      return (
        <>
          {before}
          <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-0.5 rounded">
            {match}
          </span>
          {after}
        </>
      );
    };

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs rounded-sm",
      md: "h-10 px-3 text-xs rounded-md",
      lg: "h-12 px-3.5 text-sm rounded-md",
    };

    return (
      <div ref={containerRef} className={cn("relative w-full text-left", className)}>
        {/* Trigger Button */}
        <div
          ref={ref}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "w-full flex items-center justify-between transition-all cursor-pointer select-none border font-medium",
            "bg-white dark:bg-slate-900",
            error
              ? "border-rose-500 ring-2 ring-rose-500/20"
              : isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
            sizeClasses[size]
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            {selectedOption?.icon && (
              <span className="shrink-0 text-slate-400">{selectedOption.icon}</span>
            )}
            {selectedOption ? (
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {selectedOption.label}
              </span>
            ) : (
              <span className="truncate text-slate-400">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                title="Clear selection"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
              )}
            />
          </div>
        </div>

        {/* Dropdown Menu with Search */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100">
            {/* Search Input Box */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xs z-10">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search text"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className={cn("overflow-y-auto p-1.5 space-y-0.5", maxDropdownHeight)}>
              {filteredOptions.length === 0 ? (
                <div className="py-7 px-3 text-center text-xs text-slate-400">
                  {emptyText}
                </div>
              ) : groupedOptions ? (
                // Grouped Options Render
                Object.entries(groupedOptions).map(([groupName, groupItems]) => (
                  <div key={groupName} className="space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {groupName}
                    </div>
                    {groupItems.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={opt.disabled}
                          onClick={() => handleSelect(opt.value)}
                          className={cn(
                            "w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left",
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80",
                            opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                            <div className="truncate">
                              <div>{highlightMatch(opt.label, searchQuery)}</div>
                              {opt.description && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  {opt.description}
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                // Flat Options Render
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                          : isHighlighted
                          ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                          : "text-slate-700 dark:text-slate-200",
                        opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div className="truncate">
                          <div>{highlightMatch(opt.label, searchQuery)}</div>
                          {opt.description && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom count badge */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>{filteredOptions.length} of {options.length} options</span>
              {searchQuery && (
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Filtered by &quot;{searchQuery}&quot;
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";
