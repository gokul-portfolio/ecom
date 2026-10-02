"use client";

import React from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { navigationConfig } from "@/config/navigation";
import { SidebarGroup } from "@/components/navigation/SidebarGroup";
import { SidebarBrand } from "./sidebar/SidebarBrand";
import { SidebarUserProfile } from "./sidebar/SidebarUserProfile";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col fixed top-0 left-0 bottom-0 z-40 bg-[#0b1329] border-r border-slate-800 text-slate-100 transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[70px]" : "w-[220px]"
      )}
    >
      {/* Brand Header Component */}
      <SidebarBrand />

      {/* Navigation Menu List Component */}
      <div
        className={cn(
          "flex-1 space-y-2.5",
          isCollapsed
            ? "overflow-visible px-2 py-3"
            : "overflow-y-auto px-2.5 py-3 sidebar-scroll"
        )}
      >
        {navigationConfig.map((group) => (
          <SidebarGroup key={group.id} group={group} />
        ))}
      </div>

      {/* User Profile & Red Logout Footer Component */}
      <SidebarUserProfile />
    </aside>
  );
}
