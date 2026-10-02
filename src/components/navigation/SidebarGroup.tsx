"use client";

import React from "react";
import { NavigationGroup } from "@/types/navigation.types";
import { SidebarItem } from "./SidebarItem";
import { useSidebar } from "@/hooks/useSidebar";

interface SidebarGroupProps {
  group: NavigationGroup;
}

export function SidebarGroup({ group }: SidebarGroupProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="space-y-1.5 py-1">
      {!isCollapsed ? (
        <h4 className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
          {group.groupTitle}
        </h4>
      ) : (
        <div className="h-px bg-slate-800 my-2 mx-3" />
      )}

      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
