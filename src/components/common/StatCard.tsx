import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
    period?: string;
  };
  icon: LucideIcon;
  iconAccent?: "gold" | "navy" | "emerald" | "blue";
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconAccent = "gold",
  subtitle,
}: StatCardProps) {
  const accentStyles = {
    gold: "bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-100/80",
    navy: "bg-slate-100 text-slate-800 border-slate-200 group-hover:bg-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100",
    blue: "bg-sky-50 text-sky-700 border-sky-200 group-hover:bg-sky-100",
  };

  return (
    <div className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 tracking-wide uppercase">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">{value}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div
          className={cn(
            "p-3 rounded-xl border transition-colors shrink-0",
            accentStyles[iconAccent]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {change && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded",
              change.isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
            )}
          >
            {change.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {change.value}
          </span>
          <span className="text-slate-400">{change.period || "vs last month"}</span>
        </div>
      )}
    </div>
  );
}
