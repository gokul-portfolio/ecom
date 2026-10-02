"use client";

import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/feedback/Toast";
import { AdminAuthProvider } from "@/components/providers/AdminAuthProvider";
import { StoreSettingsProvider } from "@/components/providers/StoreSettingsProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AdminAuthProvider>
          <StoreSettingsProvider>
            <div className="min-h-screen w-full font-sans antialiased">
              {children}
            </div>
          </StoreSettingsProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
