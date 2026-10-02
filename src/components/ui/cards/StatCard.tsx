import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g. +12.5 or -3.2
  changeLabel?: string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "from last month",
  icon,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </h3>

        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md",
                isPositive
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {changeLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
