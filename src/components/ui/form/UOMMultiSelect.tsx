"use client";

import React, { useState, useRef, useEffect, useMemo, forwardRef } from "react";
import {
  ChevronDown,
  Search,
  Check,
  X,
  Star,
  Scale,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UOM_DEFINITIONS,
  UOMOptionItem,
  UOMCategory,
  getUOMDefinition,
  getUOMCategory,
  getUnitConversionRatio,
  getUOMCategories,
} from "@/lib/utils/uom";

export interface UOMMultiSelectProps {
  value?: string[]; // Array of unit codes. First index is always PRIMARY.
  onChange?: (selectedUnits: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
  helperText?: string;
  showConversions?: boolean;
  lockCategory?: boolean;
  className?: string;
}

export const UOMMultiSelect = forwardRef<HTMLDivElement, UOMMultiSelectProps>(
  (
    {
      value = [],
      onChange,
      label,
      placeholder = "Select units (e.g. kg, g, ton)...",
      disabled = false,
      error,
      helperText,
      showConversions = true,
      lockCategory = true,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // First selected unit is ALWAYS Primary
    const primaryUnitCode = value[0] || null;
    const secondaryUnitCodes = value.slice(1);

    // Identify active category when a unit is selected (e.g. "kg" -> "Mass / Weight")
    const activeCategory: UOMCategory | null = useMemo(() => {
      if (!primaryUnitCode) return null;
      return getUOMCategory(primaryUnitCode);
    }, [primaryUnitCode]);

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

    // Filter units:
    // If a unit is selected (e.g. kg), strictly show ONLY that group's units!
    const displayUnits = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();

      let list = UOM_DEFINITIONS;
      if (activeCategory) {
        // Strictly filter to the active group
        list = list.filter((u) => u.category === activeCategory);
      }

      if (!q) return list;

      return list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          u.symbol.toLowerCase().includes(q)
      );
    }, [activeCategory, searchQuery]);

    // Group units when no unit is selected yet
    const groupedWhenEmpty = useMemo(() => {
      if (activeCategory) return null;
      const q = searchQuery.toLowerCase().trim();
      const categories = getUOMCategories();
      const result: { category: UOMCategory; units: UOMOptionItem[] }[] = [];

      for (const cat of categories) {
        const units = UOM_DEFINITIONS.filter(
          (u) =>
            u.category === cat &&
            (!q ||
              u.name.toLowerCase().includes(q) ||
              u.code.toLowerCase().includes(q) ||
              u.symbol.toLowerCase().includes(q))
        );
        if (units.length > 0) {
          result.push({ category: cat, units });
        }
      }
      return result;
    }, [activeCategory, searchQuery]);

    // Toggle unit selection
    const handleToggleUnit = (unitCode: string) => {
      if (disabled) return;

      if (value.includes(unitCode)) {
        const next = value.filter((c) => c !== unitCode);
        onChange?.(next);
      } else {
        const next = [...value, unitCode];
        onChange?.(next);
      }
    };

    // Promote to Primary (moves to index 0)
    const handleSetPrimary = (unitCode: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (disabled || unitCode === primaryUnitCode) return;

      const rest = value.filter((c) => c !== unitCode);
      const next = [unitCode, ...rest];
      onChange?.(next);
    };

    // Remove single unit
    const handleRemoveUnit = (unitCode: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (disabled) return;

      const next = value.filter((c) => c !== unitCode);
      onChange?.(next);
    };

    // Clear all units
    const handleClearAll = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (disabled) return;
      onChange?.([]);
    };

    // Live conversion ratios from Primary unit to Secondary units
    const conversionList = useMemo(() => {
      if (!showConversions || !primaryUnitCode || secondaryUnitCodes.length === 0) {
        return [];
      }

      return secondaryUnitCodes
        .map((secCode) => {
          const ratioInfo = getUnitConversionRatio(primaryUnitCode, secCode);
          if (!ratioInfo) return null;

          const primDef = getUOMDefinition(primaryUnitCode);
          const secDef = getUOMDefinition(secCode);

          return {
            secondaryCode: secCode,
            secondarySymbol: secDef.symbol,
            primarySymbol: primDef.symbol,
            ratio: ratioInfo.formatted,
          };
        })
        .filter(Boolean) as {
        secondaryCode: string;
        secondarySymbol: string;
        primarySymbol: string;
        ratio: string;
      }[];
    }, [showConversions, primaryUnitCode, secondaryUnitCodes]);

    return (
      <div ref={ref} className={cn("w-full space-y-2 text-left", className)}>
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>{label}</span>
            </label>
            {activeCategory && (
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Group: <strong className="text-indigo-600 dark:text-indigo-400">{activeCategory}</strong>
              </span>
            )}
          </div>
        )}

        {/* Combobox Trigger Field */}
        <div ref={containerRef} className="relative">
          <div
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                if (!isOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }
            }}
            className={cn(
              "min-h-10 w-full px-3 py-1.5 rounded-md border flex flex-wrap items-center gap-1.5 transition-all cursor-pointer",
              "bg-white dark:bg-slate-900",
              isOpen
                ? "border-indigo-500 ring-2 ring-indigo-500/20"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
              disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50",
              error && "border-rose-500 ring-2 ring-rose-500/20"
            )}
          >
            {/* Selected Tags */}
            {value.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {value.map((unitCode, idx) => {
                  const def = getUOMDefinition(unitCode);
                  const isPrimary = idx === 0;

                  return (
                    <div
                      key={unitCode}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-xs",
                        isPrimary
                          ? "bg-indigo-600 text-white shadow-indigo-500/25 ring-1 ring-indigo-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {/* Primary Star Indicator */}
                      {isPrimary ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300 text-amber-300 shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-1 py-0.2 rounded text-indigo-100">
                            Primary
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Click to set as Primary Unit"
                          onClick={(e) => handleSetPrimary(unitCode, e)}
                          className="text-slate-400 hover:text-amber-500 transition-colors p-0.5 rounded cursor-pointer"
                        >
                          <Star className="w-3 h-3 hover:fill-amber-400" />
                        </button>
                      )}

                      {/* Name & Symbol */}
                      <span>
                        <strong className="font-semibold">{def.name}</strong>{" "}
                        <span className={cn("text-[11px]", isPrimary ? "text-indigo-200" : "text-slate-400")}>
                          ({def.symbol})
                        </span>
                      </span>

                      {/* Remove Button */}
                      <button
                        type="button"
                        aria-label={`Remove ${def.name}`}
                        onClick={(e) => handleRemoveUnit(unitCode, e)}
                        className={cn(
                          "ml-0.5 p-0.5 rounded-full transition-colors cursor-pointer",
                          isPrimary
                            ? "hover:bg-indigo-700 text-indigo-200 hover:text-white"
                            : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 pl-1 select-none">
                {placeholder}
              </span>
            )}

            {/* Clear All & Chevron */}
            <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
              {value.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear selection"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform duration-200",
                  isOpen && "rotate-180 text-indigo-500"
                )}
              />
            </div>
          </div>

          {/* Clean, Simple Dropdown */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
              {/* Simple Search Header */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeCategory
                        ? `Search ${activeCategory} units...`
                        : "Search all units..."
                    }
                    className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* If active group is locked, show clean reset button */}
                {activeCategory && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Clear group selection"
                    className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Reset Group
                  </button>
                )}
              </div>

              {/* Units List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                {/* Mode 1: A group is selected (e.g. Mass/Weight for kg) -> ONLY SHOW THAT GROUP */}
                {activeCategory ? (
                  displayUnits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching units found in {activeCategory}
                    </div>
                  ) : (
                    displayUnits.map((item) => {
                      const isSelected = value.includes(item.code);
                      const isPrimary = value[0] === item.code;

                      return (
                        <div
                          key={item.code}
                          onClick={() => handleToggleUnit(item.code)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 dark:border-slate-600"
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.symbol})
                            </span>

                            {isPrimary && (
                              <span className="text-[9px] font-bold uppercase bg-indigo-600 text-white px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                Primary
                              </span>
                            )}
                          </div>

                          {/* Quick Set Primary Button */}
                          {isSelected && !isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => handleSetPrimary(item.code, e)}
                              className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <Star className="w-3 h-3" />
                              <span>Set Primary</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  /* Mode 2: Empty selection -> Show simple categorized list */
                  groupedWhenEmpty?.map((grp) => (
                    <div key={grp.category} className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-800/40 rounded">
                        {grp.category}
                      </div>
                      {grp.units.map((item) => (
                        <div
                          key={item.code}
                          onClick={() => handleToggleUnit(item.code)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              ({item.symbol})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Click to select</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clean Live Conversions Strip */}
        {showConversions && conversionList.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-indigo-500" />
              Equivalents:
            </span>
            {conversionList.map((item) => (
              <span
                key={item.secondaryCode}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                1 {item.primarySymbol} = <strong>{item.ratio}</strong> {item.secondarySymbol}
              </span>
            ))}
          </div>
        )}

        {/* Error or Helper text */}
        {error && typeof error === "string" ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

UOMMultiSelect.displayName = "UOMMultiSelect";
