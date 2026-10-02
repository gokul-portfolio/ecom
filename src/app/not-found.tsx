import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#090e1a] text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-md w-full text-center space-y-4">
        {/* Simple Clean 404 */}
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          404 error
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Page not found
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Sorry, we couldn’t find the page you’re looking for. It may have been moved or deleted.
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
