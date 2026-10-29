import React from "react";
import Link from "next/link";
import { ShoppingBag, Search, Sparkles, Layers, ShieldCheck } from "lucide-react";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Top Announcement Bar */}
      <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>Enterprise Universal Multi-Category Catalog & Real-Time Logistics Storefront</span>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span>Universal Store</span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
              <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <Link href="/products" className="hover:text-primary transition-colors">
                Catalog Management
              </Link>
              <Link href="/inventory" className="hover:text-primary transition-colors">
                Stock Balances
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center text-xs text-muted-foreground bg-muted/50 border border-border/60 rounded-full px-3 py-1.5 gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Merchant & Schema.org Verified</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>

      {/* Storefront Footer */}
      <footer className="border-t border-border/60 bg-card py-10 mt-16 text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Universal E-Commerce Catalog & Inventory Architecture. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Server-Rendered SSR</span>
            <span>•</span>
            <span>Schema.org JSON-LD</span>
            <span>•</span>
            <span>Instant Socket.IO Stock Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
