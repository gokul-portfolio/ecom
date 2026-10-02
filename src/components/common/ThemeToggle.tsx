"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="relative inline-flex h-7 w-13 items-center rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300/80 dark:border-slate-700 opacity-80 select-none"
        aria-hidden="true"
      >
        <span className="absolute left-1.5 text-amber-600 flex items-center justify-center">
          <Sun className="w-3 h-3" />
        </span>
        <span className="relative z-10 flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white dark:bg-[#0b1329] shadow-xs translate-x-0.5 text-amber-600 border border-slate-200 dark:border-slate-700">
          <Sun className="w-2.5 h-2.5 fill-amber-500" />
        </span>
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      suppressHydrationWarning
      aria-checked={isDark}
      aria-label="Toggle light and dark mode"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative inline-flex h-7 w-13 items-center rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 transition-colors duration-200 cursor-pointer border border-slate-300/80 dark:border-slate-700 select-none focus:outline-none focus:ring-2 focus:ring-amber-500/50"
    >
      {/* Background Icons */}
      <span className="absolute left-1.5 text-amber-600 flex items-center justify-center">
        <Sun className="w-3 h-3" />
      </span>
      <span className="absolute right-1.5 text-slate-400 dark:text-amber-400 flex items-center justify-center">
        <Moon className="w-3 h-3" />
      </span>

      {/* Sliding Knob */}
      <span
        className={`relative z-10 flex h-5.5 w-5.5 transform items-center justify-center rounded-full bg-white dark:bg-[#0b1329] shadow-xs transition-transform duration-200 ease-in-out border border-slate-200 dark:border-slate-700 ${
          isDark ? "translate-x-6 text-amber-400" : "translate-x-0.5 text-amber-600"
        }`}
      >
        {isDark ? (
          <Moon className="w-2.5 h-2.5 fill-amber-400" />
        ) : (
          <Sun className="w-2.5 h-2.5 fill-amber-500" />
        )}
      </span>
    </button>
  );
}
