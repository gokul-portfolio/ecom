"use client";

import React, { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import { ChevronDown, Search, Check, Scale, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UOMOption {
  code: string;
  name: string;
  symbol: string;
  category: "Mass / Weight" | "Volume / Liquid" | "Count / Packaging" | "Length & Area";
}

// Clean, standard list of units for e-commerce
export const UOM_OPTIONS_LIST: UOMOption[] = [
  // Mass / Weight
  { code: "kg", name: "Kilogram", symbol: "kg", category: "Mass / Weight" },
  { code: "g", name: "Gram", symbol: "g", category: "Mass / Weight" },
  { code: "mg", name: "Milligram", symbol: "mg", category: "Mass / Weight" },
  { code: "ton", name: "Metric Ton", symbol: "ton", category: "Mass / Weight" },
  { code: "quintal", name: "Quintal (100 kg)", symbol: "q", category: "Mass / Weight" },
  { code: "lb", name: "Pound", symbol: "lb", category: "Mass / Weight" },
  { code: "oz", name: "Ounce", symbol: "oz", category: "Mass / Weight" },

  // Volume / Liquid
  { code: "l", name: "Liter", symbol: "L", category: "Volume / Liquid" },
  { code: "ml", name: "Milliliter", symbol: "mL", category: "Volume / Liquid" },
  { code: "gal", name: "Gallon", symbol: "gal", category: "Volume / Liquid" },
  { code: "floz", name: "Fluid Ounce", symbol: "fl oz", category: "Volume / Liquid" },

  // Count / Packaging
  { code: "pcs", name: "Pieces / Units", symbol: "pcs", category: "Count / Packaging" },
  { code: "box", name: "Box", symbol: "box", category: "Count / Packaging" },
  { code: "pack", name: "Pack", symbol: "pack", category: "Count / Packaging" },
  { code: "carton", name: "Carton", symbol: "ctn", category: "Count / Packaging" },
  { code: "dozen", name: "Dozen (12)", symbol: "dz", category: "Count / Packaging" },
  { code: "set", name: "Set", symbol: "set", category: "Count / Packaging" },
  { code: "pair", name: "Pair", symbol: "pr", category: "Count / Packaging" },
  { code: "pallet", name: "Pallet", symbol: "plt", category: "Count / Packaging" },

  // Length & Area
  { code: "m", name: "Meter", symbol: "m", category: "Length & Area" },
  { code: "cm", name: "Centimeter", symbol: "cm", category: "Length & Area" },
  { code: "mm", name: "Millimeter", symbol: "mm", category: "Length & Area" },
  { code: "in", name: "Inch", symbol: "in", category: "Length & Area" },
  { code: "ft", name: "Foot", symbol: "ft", category: "Length & Area" },
  { code: "sqm", name: "Square Meter", symbol: "m²", category: "Length & Area" },
  { code: "sqft", name: "Square Foot", symbol: "sq ft", category: "Length & Area" },
];

export interface UOMValue {
  amount: number | string;
  unit: string;
}

export interface UOMInputProps {
  value?: UOMValue;
  onChange?: (val: UOMValue) => void;
  placeholder?: string;
  defaultUnit?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  error?: boolean | string;
  className?: string;
}

export const UOMInput = forwardRef<HTMLInputElement, UOMInputProps>(
  (
    {
      value = { amount: "", unit: "kg" },
      onChange,
      placeholder = "0",
      defaultUnit = "kg",
      size = "md",
      disabled = false,
      error,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentUnit = value.unit || defaultUnit;
    const currentAmount = value.amount;

    // Find active unit info
    const activeUnitObj = useMemo(() => {
      return (
        UOM_OPTIONS_LIST.find((o) => o.code.toLowerCase() === currentUnit.toLowerCase()) || {
          code: currentUnit,
          name: currentUnit.toUpperCase(),
          symbol: currentUnit,
          category: "Mass / Weight" as const,
        }
      );
    }, [currentUnit]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const amt = e.target.value;
      onChange?.({
        amount: amt,
        unit: currentUnit,
      });
    };

    const handleSelectUnit = (unitCode: string) => {
      onChange?.({
        amount: currentAmount,
        unit: unitCode,
      });
      setIsOpen(false);
      setSearchQuery("");
    };

    // Filter units in the list by search
    const filteredUnits = useMemo(() => {
      if (!searchQuery.trim()) return UOM_OPTIONS_LIST;
      const q = searchQuery.toLowerCase().trim();
      return UOM_OPTIONS_LIST.filter(
        (opt) =>
          opt.name.toLowerCase().includes(q) ||
          opt.code.toLowerCase().includes(q) ||
          opt.symbol.toLowerCase().includes(q) ||
          opt.category.toLowerCase().includes(q)
      );
    }, [searchQuery]);

    // Group units by category for clean readability
    const groupedUnits = useMemo(() => {
      const groups: Record<string, UOMOption[]> = {};
      for (const item of filteredUnits) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      }
      return groups;
    }, [filteredUnits]);

    const sizeClasses = {
      sm: "h-8 text-xs",
      md: "h-10 text-sm",
      lg: "h-12 text-base",
    };

    return (
      <div ref={dropdownRef} className={cn("relative w-full text-left", className)}>
        {/* Main Input Box */}
        <div
          className={cn(
            "flex items-center w-full rounded-md border transition-all overflow-hidden bg-white dark:bg-slate-900 shadow-xs",
            error
              ? "border-rose-500 ring-2 ring-rose-500/20"
              : isOpen
              ? "border-indigo-500 ring-2 ring-indigo-500/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
            disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
          )}
        >
          {/* Amount Number Input */}
          <div className="relative flex-1 flex items-center min-w-0">
            <input
              ref={ref}
              type="number"
              step="any"
              min="0"
              value={currentAmount}
              disabled={disabled}
              onChange={handleAmountChange}
              placeholder={placeholder}
              className={cn(
                "w-full px-3.5 font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                sizeClasses[size]
              )}
            />
          </div>

          {/* Unit Selector Button Trigger */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 border-l border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold transition-all select-none shrink-0 cursor-pointer",
              sizeClasses[size]
            )}
            title={`Selected unit: ${activeUnitObj.name}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {activeUnitObj.symbol}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180 text-indigo-600 dark:text-indigo-400"
              )}
            />
          </button>
        </div>

        {/* Clean, Simple Unit List Dropdown */}
        {isOpen && (
          <div className="absolute z-50 right-0 mt-1.5 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100">
            {/* Quick Search */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xs z-10">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search unit (kg, g, ton, pcs...)"
                  className="w-full h-8 pl-8 pr-7 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
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
            </div>

            {/* Units List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-2">
              {filteredUnits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching units found
                </div>
              ) : (
                Object.entries(groupedUnits).map(([category, items]) => (
                  <div key={category} className="space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {category}
                    </div>
                    {items.map((opt) => {
                      const isSelected = opt.code.toLowerCase() === currentUnit.toLowerCase();
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => handleSelectUnit(opt.code)}
                          className={cn(
                            "w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors text-left",
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-10 font-mono font-bold text-slate-900 dark:text-slate-100">
                              {opt.symbol}
                            </span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {opt.name}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Simple footer with unit count */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>{UOM_OPTIONS_LIST.length} Units Available</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                Active: {activeUnitObj.symbol}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

UOMInput.displayName = "UOMInput";
