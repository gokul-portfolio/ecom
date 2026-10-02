"use client";

import React, { useState, useRef, useEffect, createContext, useContext, useMemo } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  close: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a Dropdown provider");
  }
  return context;
}

export interface DropdownProps {
  children: React.ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({ children, className, onOpenChange }: DropdownProps) {
  const [isOpen, setIsOpenState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const setIsOpen: React.Dispatch<React.SetStateAction<boolean>> = (value) => {
    setIsOpenState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (!next) setSearchQuery("");
      onOpenChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const close = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, close, searchQuery, setSearchQuery }}>
      <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={cn("cursor-pointer inline-flex items-center", className)}
      role="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(!isOpen);
        }
      }}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuProps {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  width?: string;
  maxHeight?: string;
}

export function DropdownMenu({
  children,
  align = "right",
  className,
  width = "w-56",
  maxHeight = "max-h-80",
}: DropdownMenuProps) {
  const { isOpen } = useDropdown();

  if (!isOpen) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-1.5 py-1.5 rounded-2xl shadow-2xl overflow-hidden flex flex-col",
        "bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800",
        "animate-in fade-in-0 zoom-in-95 duration-100",
        align === "right" ? "right-0" : "left-0",
        width,
        className
      )}
    >
      <div className={cn("overflow-y-auto", maxHeight)}>
        {children}
      </div>
    </div>
  );
}

export interface DropdownSearchProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (val: string) => void;
  autoFocus?: boolean;
}

/**
 * Dropdown Search Input subcomponent
 * Allows users to type and filter options inside any DropdownMenu
 */
export function DropdownSearch({
  placeholder = "Search options...",
  className,
  value,
  onChange,
  autoFocus = true,
}: DropdownSearchProps) {
  const { searchQuery, setSearchQuery } = useDropdown();
  const currentVal = value !== undefined ? value : searchQuery;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) {
      onChange(val);
    } else {
      setSearchQuery(val);
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange("");
    } else {
      setSearchQuery("");
    }
  };

  return (
    <div className={cn("p-2 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xs z-10", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={currentVal}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-8 pl-8 pr-7 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {currentVal && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            title="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export interface DropdownItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  searchFilter?: string; // custom keywords to match with DropdownSearch
  className?: string;
}

export function DropdownItem({
  children,
  icon,
  onClick,
  destructive = false,
  disabled = false,
  searchFilter,
  className,
}: DropdownItemProps) {
  const { close, searchQuery } = useDropdown();

  // If searchQuery is present, check match
  const isMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (typeof children === "string" && children.toLowerCase().includes(q)) return true;
    if (searchFilter && searchFilter.toLowerCase().includes(q)) return true;
    return false;
  }, [children, searchQuery, searchFilter]);

  if (!isMatch) return null;

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    close();
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "w-full px-3 py-2 text-xs font-semibold flex items-center gap-2.5 transition-colors text-left",
        destructive
          ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider({ className }: { className?: string }) {
  return <div className={cn("my-1 border-t border-slate-100 dark:border-slate-800", className)} />;
}

export function DropdownLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500", className)}>
      {children}
    </div>
  );
}

export function DropdownEmpty({ children = "No matching options found", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("py-6 px-3 text-center text-xs text-slate-400", className)}>
      {children}
    </div>
  );
}
