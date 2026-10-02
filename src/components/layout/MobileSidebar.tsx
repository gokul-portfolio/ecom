"use client";

import React from "react";
import Link from "next/link";
import { Crown, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { navigationConfig } from "@/config/navigation";
import { SidebarGroup } from "@/components/navigation/SidebarGroup";
import { IconButton } from "@/components/common/IconButton";
import { SidebarUserProfile } from "./sidebar/SidebarUserProfile";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const { isMobileOpen, closeMobile } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={closeMobile}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        aria-hidden="true"
      />

      {/* Off-canvas Drawer Panel */}
      <div
        className={cn(
          "relative flex-1 flex flex-col max-w-xs w-full bg-[#0b1329] border-r border-slate-800 text-slate-100 z-50 shadow-2xl animate-in slide-in-from-left duration-200"
        )}
      >
        {/* Drawer Header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-800/80">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
              <Crown className="w-4 h-4 fill-slate-950 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white">NOBLE COMMERCE</span>
              <span className="text-[11px] text-slate-400">Admin Console</span>
            </div>
          </Link>

          <IconButton
            onClick={closeMobile}
            variant="ghost"
            size="sm"
            aria-label="Close menu"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Drawer Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sidebar-scroll">
          {navigationConfig.map((group) => (
            <SidebarGroup key={group.id} group={group} />
          ))}
        </div>

        {/* Reusable SidebarUserProfile Component */}
        <SidebarUserProfile onLogout={closeMobile} />
      </div>
    </div>
  );
}
