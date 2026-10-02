"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Crown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";

export function SidebarBrand() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { settings } = useStoreSettings();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const brandName = settings?.companyName || "NOBLE COMMERCE";
  const brandLogo = settings?.logoUrl;
  const brandTagline = settings?.tagline || "Admin Console";

  // During SSR and before mount, preserve default uncollapsed to prevent hydration mismatches
  const effectiveCollapsed = mounted ? isCollapsed : false;

  if (effectiveCollapsed) {
    return (
      <div className="h-14 border-b border-slate-800/80 flex items-center justify-center w-full px-2 shrink-0">
        <button
          onClick={toggleCollapse}
          aria-label="Expand sidebar"
          title="Click to expand sidebar"
          suppressHydrationWarning
          className="group relative w-8 h-8 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-amber-400 transition-colors cursor-pointer shadow-xs overflow-hidden"
        >
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="w-full h-full object-cover group-hover:hidden" />
          ) : (
            <Crown className="w-3.5 h-3.5 fill-amber-400 group-hover:hidden transition-all" />
          )}
          <ChevronsRight className="w-3.5 h-3.5 hidden group-hover:block text-white transition-all" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-14 border-b border-slate-800/80 flex items-center justify-between w-full px-3 shrink-0">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 overflow-hidden group min-w-0"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shrink-0 shadow-xs overflow-hidden">
          {brandLogo ? (
            <img src={brandLogo} alt={brandName} className="w-full h-full object-cover" />
          ) : (
            <Crown className="w-4 h-4 fill-slate-950 text-slate-950" />
          )}
        </div>

        <div className="flex flex-col truncate min-w-0 text-left">
          <span className="font-bold text-[13px] tracking-tight text-white leading-tight truncate uppercase">
            {brandName}
          </span>
          <span className="text-[10px] text-slate-400 truncate">
            {brandTagline}
          </span>
        </div>
      </Link>

      <button
        onClick={toggleCollapse}
        aria-label="Collapse sidebar"
        title="Collapse sidebar"
        suppressHydrationWarning
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0 ml-1"
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
