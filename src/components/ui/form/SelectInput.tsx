"use client";

import React, { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectInputProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
  name?: string;
  size?: "sm" | "md" | "lg";
  error?: boolean | string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
}

export const SelectInput = forwardRef<HTMLInputElement, SelectInputProps>(
  (
    {
      options = [],
      value,
      defaultValue = "",
      onChange,
      onBlur,
      name,
      size = "md",
      error,
      placeholder = "Select or type to filter...",
      disabled = false,
      className,
      id,
      clearable = true,
      ...props
    },
    ref
  ) => {
    // Internal selected value (controlled vs uncontrolled)
    const [internalValue, setInternalValue] = useState<string>(
      value !== undefined ? value : defaultValue
    );

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with external controlled value
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const activeValue = value !== undefined ? value : internalValue;
    const selectedOption = options.find((opt) => opt.value === activeValue);

    // When not typing, input text displays the selected option's label
    const displayValue = isOpen ? searchQuery : selectedOption ? selectedOption.label : "";

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options as user types directly in the input
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase().trim();
      return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, searchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      setHighlightedIndex(0);
      if (!isOpen) setIsOpen(true);
    };

    const handleSelectOption = (option: SelectOption) => {
      if (option.disabled || disabled) return;

      setInternalValue(option.value);
      setIsOpen(false);
      setSearchQuery("");

      // Dispatch event compatible with React Hook Form
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: name || "",
            value: option.value,
          },
        };
        onChange(syntheticEvent);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInternalValue("");
      setSearchQuery("");
      if (onChange) {
        onChange({ target: { name: name || "", value: "" } });
      }
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setSearchQuery("");
          setHighlightedIndex(0);
          return;
        }
        // Let Enter, ArrowUp, ArrowLeft, ArrowRight bubble for form navigation
        return;
      }

      // When dropdown is open:
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else {
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // Close dropdown and let event bubble to form navigation
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const sizeClasses = {
      sm: "h-8 px-2.5 text-xs rounded-sm",
      md: "h-10 px-3.5 text-xs rounded-md",
      lg: "h-12 px-4 text-sm rounded-md",
    };

    return (
      <div
        ref={containerRef}
        onBlur={(e) => {
          // If focus leaves this container completely, close dropdown
          if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
            setSearchQuery("");
          }
        }}
        className={cn("relative w-full text-left", className)}
      >
        {/* Hidden input for React Hook Form integration */}
        <input
          type="hidden"
          name={name}
          value={activeValue}
          ref={ref}
          {...props}
        />

        {/* The Main Input Field itself — user types directly here! */}
        <div
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
              setIsOpen((prev) => !prev);
            }
          }}
          className={cn(
            "relative flex items-center w-full transition-all border font-medium overflow-hidden cursor-pointer",
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
          <input
            ref={inputRef}
            id={id}
            type="text"
            disabled={disabled}
            value={displayValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onFocus={(e) => {
              // Do NOT open on focus; only select text
              e.target.select();
            }}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              onBlur?.(e);
            }}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none pr-12 truncate font-semibold cursor-pointer"
          />

          {/* Right Action Icons (Clear & Chevron) */}
          <div className="absolute right-2.5 flex items-center gap-1 shrink-0">
            {clearable && activeValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setIsOpen(!isOpen);
                  inputRef.current?.focus();
                }
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
                )}
              />
            </button>
          </div>
        </div>

        {/* Dropdown Options Popup */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 py-1 animate-in fade-in-0 zoom-in-95 duration-100">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching options found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === activeValue;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
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
);

SelectInput.displayName = "SelectInput";
