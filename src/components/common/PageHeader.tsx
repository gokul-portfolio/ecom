import React from "react";
import { PageHeaderProps } from "@/types/layout.types";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-2">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
