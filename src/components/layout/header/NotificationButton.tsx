"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, CheckCircle, Clock } from "lucide-react";

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="relative p-1.5 rounded-lg text-slate-500 opacity-80 select-none">
        <Bell className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        suppressHydrationWarning
        className="relative p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                3 new
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
            >
              Mark all read
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            <div className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  New Order #ORD-2026-981 Received
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Amount: ₹14,250 via Razorpay UPI.
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 2 mins ago
                </span>
              </div>
            </div>

            <div className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Inventory Sync Completed
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  42 warehouse SKUs synced successfully with PostgreSQL.
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 1 hour ago
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
