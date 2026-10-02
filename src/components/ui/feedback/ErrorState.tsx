import React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../button/Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
  className?: string;
}

export function ErrorState({
  title = "Failed to load content",
  message = "An error occurred while communicating with the server. Please verify your connection and try again.",
  onRetry,
  homeHref = "/dashboard",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-xs">
        <AlertCircle className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        {message}
      </p>
      <div className="flex items-center gap-2.5 mt-5">
        {onRetry && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        )}
        {homeHref && (
          <Link href={homeHref}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Home className="w-3.5 h-3.5" />}
            >
              Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
