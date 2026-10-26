"use client";

import React, { useState, useEffect } from "react";
import { Keyboard, X, Sparkles, Search, Layers, Table, FileText, Cpu } from "lucide-react";
import { SHORTCUT_REGISTRY, ShortcutDefinition } from "@/config/shortcuts";
import { Kbd } from "./Kbd";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";
import { cn } from "@/lib/utils";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Register Global Hotkeys (F6, F1, Shift+?, Escape)
  useKeyboardShortcuts({
    "f6, f1, shift+?": (e) => {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    },
    escape: () => {
      if (isOpen) setIsOpen(false);
    },
  });

  // Listen for custom event triggered from Navbar Header button
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("toggle-shortcuts-drawer", handleToggle);
    window.addEventListener("open-shortcuts-drawer", handleOpen);
    window.addEventListener("close-shortcuts-drawer", handleClose);

    return () => {
      window.removeEventListener("toggle-shortcuts-drawer", handleToggle);
      window.removeEventListener("open-shortcuts-drawer", handleOpen);
      window.removeEventListener("close-shortcuts-drawer", handleClose);
    };
  }, []);

  // Filter items by search
  const filteredShortcuts = SHORTCUT_REGISTRY.filter(
    (item) =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keys.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const categories: Record<string, ShortcutDefinition[]> = filteredShortcuts.reduce(
    (acc, curr) => {
      acc[curr.category] = acc[curr.category] || [];
      acc[curr.category].push(curr);
      return acc;
    },
    {} as Record<string, ShortcutDefinition[]>
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Global":
        return <Layers className="w-3.5 h-3.5 text-indigo-500" />;
      case "Form Entry":
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case "Tables & Lists":
        return <Table className="w-3.5 h-3.5 text-blue-500" />;
      case "Function Keys":
        return <Cpu className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-over Right Offcanvas Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-screen max-w-md bg-white dark:bg-[#0c1322] border-l border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300",
            "animate-in slide-in-from-right duration-250"
          )}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/60">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    F6
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-speed data entry & table navigation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              suppressHydrationWarning
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close shortcuts drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Filter */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shortcuts (e.g. edit, table, enter)..."
                className="w-full h-8.5 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                autoFocus
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Drawer Body - Categorized Shortcuts */}
          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            {Object.keys(categories).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No shortcuts found matching &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              Object.entries(categories).map(([category, items]) => (
                <div key={category} className="space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/60">
                    {getCategoryIcon(category)}
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {category}
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-medium pr-2">
                          {item.description}
                        </span>
                        <div className="shrink-0 flex items-center gap-1">
                          <Kbd keys={item.keys} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Press <Kbd keys={["Esc"]} size="xs" /> to close
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
