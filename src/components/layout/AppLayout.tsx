"use client";

import React, { ReactNode } from "react";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/feedback/Toast";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { AdminAuthProvider } from "@/components/providers/AdminAuthProvider";
import { StoreSettingsProvider } from "@/components/providers/StoreSettingsProvider";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { MainContent } from "./MainContent";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <ToastProvider>
          <SocketProvider>
            <AdminAuthProvider>
              <StoreSettingsProvider>
                <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090e1a] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden transition-colors duration-200">
                  {/* Desktop Fixed Collapsible Sidebar */}
                  <Sidebar />

                  {/* Mobile Off-canvas Drawer */}
                  <MobileSidebar />

                  {/* Dynamic Main Layout (Header + Children + Footer) */}
                  <MainContent>{children}</MainContent>

                  {/* Global Enterprise Keyboard Shortcuts Modal */}
                  <KeyboardShortcutsModal />
                </div>
              </StoreSettingsProvider>
            </AdminAuthProvider>
          </SocketProvider>
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
