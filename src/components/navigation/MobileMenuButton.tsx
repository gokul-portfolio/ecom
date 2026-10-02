"use client";

import React from "react";
import { Menu, X } from "lucide-react";
import { useSidebar } from "@/hooks/useSidebar";
import { IconButton } from "@/components/common/IconButton";

export function MobileMenuButton() {
  const { isMobileOpen, toggleMobile } = useSidebar();

  return (
    <IconButton
      onClick={toggleMobile}
      aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
      variant="ghost"
      size="md"
      className="md:hidden text-slate-700 hover:text-slate-900"
    >
      {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </IconButton>
  );
}
