"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Building2, User, LogOut } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LogoutConfirmDialog } from "@/components/ui/modal";

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { admin, logout } = useAdminAuth();

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenLogoutConfirm = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const displayName = admin?.fullName || "Admin User";
  const displayEmail = admin?.email || "admin@gmail.com";

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-1 sm:p-1.5 opacity-80 select-none">
        <Avatar name="Admin" size="xs" />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        suppressHydrationWarning
        className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
        aria-label="User profile menu"
      >
        <Avatar name={displayName} size="xs" />

        <div className="hidden lg:block text-left text-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{displayName}</p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0c1527] border border-slate-200 dark:border-slate-800/80 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md text-left">
          {/* User Info Header Card (Clean: Only Avatar, Name, and Email - No Super Admin or Active badge) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 mb-1.5">
            <div className="flex items-center gap-2.5">
              <Avatar name={displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Exactly 2 Menu Action Links: Company Profile & My Profile */}
          <div className="space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full px-2.5 py-2 flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/10 transition-colors shrink-0">
                <Building2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              </div>
              <span className="flex-1 font-semibold">Company Profile</span>
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full px-2.5 py-2 flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 dark:group-hover:bg-amber-500/10 transition-colors shrink-0">
                <User className="w-3.5 h-3.5" strokeWidth={1.8} />
              </div>
              <span className="flex-1 font-semibold">My Profile</span>
            </Link>
          </div>

          {/* Sign Out / Logout */}
          <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800/80" />

          <button
            onClick={handleOpenLogoutConfirm}
            type="button"
            suppressHydrationWarning
            className="w-full px-2.5 py-2 flex items-center gap-2.5 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform shrink-0">
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
            </div>
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal before Sign Out */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
        userName={displayName}
        userEmail={displayEmail}
      />
    </div>
  );
}
