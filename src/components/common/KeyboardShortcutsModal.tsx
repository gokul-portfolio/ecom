"use client";

import React, { useState } from "react";
import { Keyboard, X, Sparkles } from "lucide-react";
import { SHORTCUT_REGISTRY, ShortcutDefinition } from "@/config/shortcuts";
import { Kbd } from "./Kbd";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Register Global Hotkeys to trigger this modal (Shift+?, F1, Escape to close)
  useKeyboardShortcuts({
    "shift+?, f1": (e) => {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    },
    "escape": () => {
      if (isOpen) setIsOpen(false);
    },
  });

  if (!isOpen) return null;

  // Group by category
  const categories: Record<string, ShortcutDefinition[]> = SHORTCUT_REGISTRY.reduce(
    (acc, curr) => {
      acc[curr.category] = acc[curr.category] || [];
      acc[curr.category].push(curr);
      return acc;
    },
    {} as Record<string, ShortcutDefinition[]>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Enterprise Keyboard Shortcuts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Industrial Standard
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                High-speed data entry, arrow navigation, and system function hotkeys
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.description}
                    </span>
                    <Kbd keys={item.keys} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Press <Kbd keys={["Esc"]} size="xs" /> anytime to dismiss
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded-lg font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
