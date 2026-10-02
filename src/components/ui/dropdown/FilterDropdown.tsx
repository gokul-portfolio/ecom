"use client";

import React, { useState, useMemo } from "react";
import { Filter, Check } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
  DropdownSearch,
  DropdownEmpty,
} from "./Dropdown";
import { Button } from "../button/Button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onReset?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  width?: string;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  selectedValue,
  onSelect,
  onReset,
  searchable = true,
  searchPlaceholder = "Filter options...",
  width = "w-56",
  className,
}: FilterDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeOption = options.find((opt) => opt.value === selectedValue);

  // Filter options based on typed search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <Dropdown className={className} onOpenChange={(open) => !open && setSearchQuery("")}>
      <DropdownTrigger>
        <Button
          variant={selectedValue ? "primary" : "outline"}
          size="sm"
          leftIcon={<Filter className="w-3.5 h-3.5" />}
        >
          {activeOption ? `${label}: ${activeOption.label}` : label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu align="left" width={width}>
        <DropdownLabel>{label}</DropdownLabel>

        {/* Search filter input */}
        {searchable && (
          <DropdownSearch
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        )}

        <div className="py-1">
          {filteredOptions.length === 0 ? (
            <DropdownEmpty>No matching options found</DropdownEmpty>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <DropdownItem
                  key={opt.value}
                  onClick={() => onSelect(opt.value)}
                  className={cn(
                    "flex items-center justify-between",
                    isSelected && "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  ) : opt.count !== undefined ? (
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      ({opt.count})
                    </span>
                  ) : null}
                </DropdownItem>
              );
            })
          )}
        </div>

        {selectedValue && onReset && (
          <>
            <DropdownDivider />
            <DropdownItem
              onClick={onReset}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            >
              Clear Filter
            </DropdownItem>
          </>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
