"use client";

import React from "react";
import Image from "next/image";
import { Star, CheckCircle, XCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export interface StatusBadgeCellProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export function StatusBadgeCell({
  status,
  variant = "neutral",
}: StatusBadgeCellProps) {
  const variantStyles = {
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    danger:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    info: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
    neutral:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const isLive = variant === "success" || variant === "warning";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors shadow-xs select-none",
        variantStyles[variant]
      )}
    >
      {isLive ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {status}
    </span>
  );
}

export interface PriceCellProps {
  amount: number;
  originalAmount?: number;
  currency?: string;
}

export function PriceCell({ amount, originalAmount, currency = "$" }: PriceCellProps) {
  return (
    <div className="flex flex-col text-left">
      <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
        {formatCurrency(amount, currency)}
      </span>
      {originalAmount && originalAmount > amount && (
        <span className="text-[10px] text-slate-400 line-through">
          {formatCurrency(originalAmount, currency)}
        </span>
      )}
    </div>
  );
}

export interface StockCellProps {
  stock: number;
  lowStockThreshold?: number;
}

export function StockCell({ stock, lowStockThreshold = 10 }: StockCellProps) {
  if (stock === 0) {
    return (
      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
        Out of Stock
      </span>
    );
  }
  if (stock <= lowStockThreshold) {
    return (
      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
        Low ({stock} left)
      </span>
    );
  }
  return (
    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
      {stock} in stock
    </span>
  );
}

export interface ImageCellProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
}

export function ImageCell({ src, alt = "Item", fallbackText = "IMG" }: ImageCellProps) {
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-slate-400">{fallbackText}</span>
      )}
    </div>
  );
}

export interface RatingCellProps {
  rating: number;
  reviewsCount?: number;
}

export function RatingCell({ rating, reviewsCount }: RatingCellProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-400">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      </div>
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
        {rating.toFixed(1)}
      </span>
      {reviewsCount !== undefined && (
        <span className="text-[11px] text-slate-400">({reviewsCount})</span>
      )}
    </div>
  );
}

export interface BooleanCellProps {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}

export function BooleanCell({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
}: BooleanCellProps) {
  return (
    <div className="flex items-center gap-1.5">
      {value ? (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {trueLabel}
          </span>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {falseLabel}
          </span>
        </>
      )}
    </div>
  );
}

export interface DateCellProps {
  date: string | Date;
  includeTime?: boolean;
}

export function DateCell({ date, includeTime = false }: DateCellProps) {
  const d = new Date(date);
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

  return (
    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      {formatted}
    </span>
  );
}
