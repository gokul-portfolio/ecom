"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, LayoutDashboard, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#090e1a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322] shadow-2xl text-center space-y-6 animate-in zoom-in-95">
        {/* Warning Icon Container */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-900/40 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Something Went Wrong
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            An unexpected error occurred while processing your request. You can retry the operation
            or navigate back to safety.
          </p>
          {error?.message && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-rose-500 border border-slate-200 dark:border-slate-800 break-all text-left">
              {error.message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              fullWidth
              leftIcon={<LayoutDashboard className="w-4 h-4" />}
            >
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Additional Navigation Links */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link
            href="/component-showcase"
            className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>UI Playground</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
