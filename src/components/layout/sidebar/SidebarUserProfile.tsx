"use client";

import React, { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useSidebar } from "@/hooks/useSidebar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LogoutConfirmDialog } from "@/components/ui/modal";

interface SidebarUserProfileProps {
  onLogout?: () => void;
}

export function SidebarUserProfile({ onLogout }: SidebarUserProfileProps) {
  const { isCollapsed } = useSidebar();
  const { admin, logout } = useAdminAuth();
  const [mounted, setMounted] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (onLogout) {
        onLogout();
      }
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const displayName = admin?.fullName || "Admin User";
  const displayRole = admin?.role?.name || "Staff";
  const effectiveCollapsed = mounted ? isCollapsed : false;

  return (
    <div className="p-2.5 border-t border-slate-800/80 shrink-0 bg-[#070c1a]">
      {!effectiveCollapsed ? (
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <Avatar name={displayName} size="xs" />
            <div className="flex flex-col truncate min-w-0">
              <span className="text-[12px] font-semibold text-white truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-amber-400 font-medium truncate">
                {displayRole}
              </span>
            </div>
          </div>

          {/* Red Logout Icon Button */}
          <button
            onClick={handleOpenLogoutConfirm}
            type="button"
            title="Sign Out"
            aria-label="Sign Out"
            suppressHydrationWarning
            className="p-1.5 rounded-lg text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-400 border border-rose-500/20 transition-all cursor-pointer shrink-0 ml-1 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Collapsed Mode (76px): Centered Avatar with Tooltip */
        <div className="group relative flex justify-center py-1">
          <button
            onClick={handleOpenLogoutConfirm}
            type="button"
            suppressHydrationWarning
            className="cursor-pointer focus:outline-none"
            title={`${displayName} (${displayRole}) - Click to sign out`}
          >
            <Avatar name={displayName} size="xs" />
          </button>

          {/* Hover Tooltip in collapsed mode */}
          <div className="absolute left-full ml-3 bottom-0 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-xl flex items-center gap-3">
            <div>
              <p className="font-semibold text-slate-100">{displayName}</p>
              <p className="text-[10px] text-amber-400">{displayRole}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLogoutConfirm();
              }}
              type="button"
              title="Sign Out"
              suppressHydrationWarning
              className="p-1.5 rounded-lg text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Sign Out */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => !isLoggingOut && setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
        userName={displayName}
        userEmail={admin?.email}
      />
    </div>
  );
}
