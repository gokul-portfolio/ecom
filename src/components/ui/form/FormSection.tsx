import React from "react";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4 pt-4 first:pt-0", className)}>
      <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "between";
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    right: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6",
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
