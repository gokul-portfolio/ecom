"use client";

import React, { useState, useEffect } from "react";
import { Search, Command, ExternalLink } from "lucide-react";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Search Bar Button Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        suppressHydrationWarning
        aria-label="Search dashboard"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-xs font-medium cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden md:inline text-slate-500 dark:text-slate-400">Quick search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
          <Command className="w-3 h-3" /> K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search orders, products, customers, or SKUs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-3 py-4 text-sm text-slate-900 dark:text-slate-100 bg-transparent placeholder-slate-400 focus:outline-none"
              />
              <kbd
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                ESC
              </kbd>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 space-y-3">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                Quick Navigation
              </p>
              <div className="space-y-1">
                <a
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span>Go to Overview Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span>Manage Products Catalog</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
                <a
                  href="/sales/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <span>View Recent Sales & Orders</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
