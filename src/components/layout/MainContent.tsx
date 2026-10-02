"use client";

import React, { ReactNode } from "react";
import { useSidebar } from "@/hooks/useSidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-all duration-300 ease-in-out bg-[#f8fafc] dark:bg-[#090e1a] text-slate-900 dark:text-slate-100 w-full min-w-0",
        isCollapsed
          ? "md:ml-[70px] md:w-[calc(100%-70px)] md:max-w-[calc(100%-70px)]"
          : "md:ml-[220px] md:w-[calc(100%-220px)] md:max-w-[calc(100%-220px)]"
      )}
    >
      {/* Sticky Header */}
      <Header />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 min-w-0">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
