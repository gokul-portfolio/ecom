"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MobileMenuButton } from "@/components/navigation/MobileMenuButton";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SocketStatusIndicator } from "@/components/common/SocketStatusIndicator";
import { NotificationButton } from "./header/NotificationButton";
import { UserProfileDropdown } from "./header/UserProfileDropdown";

export function Header() {
  const pathname = usePathname();

  // Generate dynamic breadcrumb from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    return { label, href };
  });

  return (
    <header className="sticky top-0 z-30 h-14 bg-white dark:bg-[#0b1329] border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between transition-colors duration-200 w-full min-w-0">
      {/* Left Section: Mobile Toggle, Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <MobileMenuButton />

        {/* Breadcrumb Navigation Component */}
        <div className="hidden sm:block min-w-0 truncate">
          <Breadcrumb
            items={
              breadcrumbItems.length > 0
                ? breadcrumbItems
                : [{ label: "Dashboard", href: "/dashboard" }]
            }
          />
        </div>
      </div>

      {/* Right Section: Real-time Socket Indicator, Theme Toggle, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Real-time WebSocket Live Status */}
        <SocketStatusIndicator />

        {/* Theme Toggle Component */}
        <ThemeToggle />

        {/* Notifications Button Component */}
        <NotificationButton />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile Dropdown Component */}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
