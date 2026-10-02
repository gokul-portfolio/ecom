"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NavigationItem } from "@/types/navigation.types";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  item: NavigationItem;
}

export function SidebarItem({ item }: SidebarItemProps) {
  const pathname = usePathname();
  const { isCollapsed, closeMobile } = useSidebar();
  const Icon = item.icon;

  const hasChildren = Boolean(item.children && item.children.length > 0);

  const isActive = item.href ? pathname === item.href : false;
  const isChildActive = hasChildren
    ? item.children?.some((child) => pathname === child.href)
    : false;

  const isCurrentSection = isActive || isChildActive;

  const [isOpen, setIsOpen] = useState<boolean>(isChildActive || false);

  const toggleSubmenu = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const itemContent = (
    <div
      className={cn(
        "group relative flex items-center transition-colors duration-150 cursor-pointer select-none",
        isCurrentSection
          ? "bg-slate-800/90 text-white font-semibold"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
        isCollapsed ? "justify-center px-0 w-8 h-8 rounded-lg mx-auto" : "w-full gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
      )}
    >
      {/* Icon with Gold Highlight when Active */}
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-150",
          isCollapsed ? "w-3.5 h-3.5" : "w-4 h-4",
          isCurrentSection
            ? "text-amber-400"
            : "text-slate-400 group-hover:text-slate-200"
        )}
        strokeWidth={isCollapsed ? 1.75 : 1.8}
      />

      {/* Title */}
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-left text-xs font-medium tracking-tight">{item.title}</span>

          {hasChildren && (
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0",
                isOpen && "rotate-180 text-slate-200"
              )}
            />
          )}
        </>
      )}

      {/* Clean Tooltip when collapsed */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 rounded-md bg-[#0f172a] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-xl border border-slate-700">
          {item.title}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {hasChildren ? (
        <div onClick={toggleSubmenu} title={isCollapsed ? item.title : undefined}>{itemContent}</div>
      ) : item.href ? (
        <Link href={item.href} onClick={closeMobile} title={isCollapsed ? item.title : undefined} className="block">
          {itemContent}
        </Link>
      ) : (
        itemContent
      )}

      {/* Submenu links */}
      {!isCollapsed && hasChildren && isOpen && (
        <div className="mt-1 ml-4 pl-3 border-l border-slate-800 space-y-0.5">
          {item.children?.map((subItem) => {
            const isSubActive = pathname === subItem.href;
            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={closeMobile}
                className={cn(
                  "block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isSubActive
                    ? "text-amber-400 bg-slate-800/60 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                )}
              >
                {subItem.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
