"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number; // 1-indexed (e.g. 1, 2, 3...)
  totalPages: number; // Total number of pages
  totalItems?: number; // Total row count across all pages
  pageSize?: number; // Number of items per page
  pageSizeOptions?: number[]; // [5, 10, 20, 50, 100]
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  variant?: "numbered" | "simple" | "compact";
  showPageSize?: boolean;
  showTotal?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Highly polished, accessible, user-friendly Pagination component
 */
export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  variant = "numbered",
  showPageSize = true,
  showTotal = true,
  disabled = false,
  className,
}: PaginationProps) {
  // Ensure valid safe page numbers
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const safeTotalPages = Math.max(1, totalPages || 1);

  // Compute pagination range with ellipses
  const pageRange = useMemo(() => {
    const total = safeTotalPages;
    const current = safeCurrentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  }, [safeTotalPages, safeCurrentPage]);

  // Compute item count range (Showing X to Y of Z)
  const itemRange = useMemo(() => {
    if (totalItems === undefined) return null;
    if (totalItems === 0) return { from: 0, to: 0, total: 0 };
    const from = (safeCurrentPage - 1) * pageSize + 1;
    const to = Math.min(safeCurrentPage * pageSize, totalItems);
    return { from, to, total: totalItems };
  }, [safeCurrentPage, pageSize, totalItems]);

  const canGoPrevious = safeCurrentPage > 1 && !disabled;
  const canGoNext = safeCurrentPage < safeTotalPages && !disabled;

  return (
    <div
      role="navigation"
      aria-label="Pagination Navigation"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 w-full select-none",
        "border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {/* Left: Total Records & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        {/* Total Items Count */}
        {showTotal && itemRange && (
          <span className="font-medium text-slate-600 dark:text-slate-300">
            Showing <strong className="font-bold text-slate-900 dark:text-slate-100">{itemRange.from}</strong> to{" "}
            <strong className="font-bold text-slate-900 dark:text-slate-100">{itemRange.to}</strong> of{" "}
            <strong className="font-bold text-slate-900 dark:text-slate-100">{itemRange.total}</strong> results
          </span>
        )}

        {/* Page Size Selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 text-[11px] font-medium">Rows:</span>
            <div className="relative flex items-center">
              <select
                aria-label="Rows per page"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                disabled={disabled}
                className={cn(
                  "h-8 pl-2.5 pr-7 text-xs font-semibold rounded-lg appearance-none cursor-pointer transition-colors",
                  "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200",
                  "border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                )}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page Button (Optional on larger screens) */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          aria-label="First page"
          title="First page"
          className={cn(
            "p-1.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer",
            "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
            !canGoPrevious && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Previous page"
          className={cn(
            "h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer",
            "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
            !canGoPrevious && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numbered Page Buttons (Variant: numbered) */}
        {variant === "numbered" ? (
          <div className="flex items-center gap-1">
            {pageRange.map((page, idx) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs font-bold"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </span>
                );
              }

              const isCurrent = page === safeCurrentPage;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => onPageChange(page as number)}
                  disabled={disabled}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer",
                    isCurrent
                      ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/30 ring-1 ring-indigo-500"
                      : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>
        ) : (
          /* Simple / Compact Page Indicator */
          <div className="px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {safeCurrentPage} / {safeTotalPages}
          </div>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={!canGoNext}
          aria-label="Next page"
          className={cn(
            "h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer",
            "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
            !canGoNext && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={!canGoNext}
          aria-label="Last page"
          title="Last page"
          className={cn(
            "p-1.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-colors hidden md:flex items-center justify-center cursor-pointer",
            "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
            !canGoNext && "opacity-30 cursor-not-allowed pointer-events-none"
          )}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
