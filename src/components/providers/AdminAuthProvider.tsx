"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AdminUserSession {
  id: string;
  email: string | null;
  username?: string | null;
  hasLoginAccess?: boolean;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isSuperAdmin?: boolean;
  department?: {
    code: string;
    name: string;
  } | null;
  role?: {
    slug: string;
    name: string;
    isSystem?: boolean;
    permissions: string[];
  } | null;
  hasCompletedOnboarding?: boolean;
}

interface AdminAuthContextType {
  admin: AdminUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>;
  logout: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  hasPermission: () => false,
  login: async () => ({ success: false, error: "Not initialized" }),
  logout: async () => {},
  refetchSession: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Fetch current session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setAdmin(json.user);
          // If onboarding is not completed, strictly redirect away from admin pages to /onboarding
          if (
            !json.user.hasCompletedOnboarding &&
            typeof window !== "undefined" &&
            window.location.pathname !== "/onboarding" &&
            !window.location.pathname.startsWith("/admin-login")
          ) {
            router.replace("/onboarding");
          }
          return;
        }
      }
      setAdmin(null);
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Enterprise RBAC Permission evaluation helper with domain wildcard support
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!admin) return false;
      if (admin.isSuperAdmin) return true;
      const perms = admin.role?.permissions || [];
      // Full system root access
      if (perms.includes("*")) return true;
      // Exact match
      if (perms.includes(permission)) return true;
      // Domain wildcard check (e.g. "departments:*" matches "departments:export")
      const [domain] = permission.split(":");
      if (domain && (perms.includes(`${domain}:*`) || perms.includes(`${domain}:manage`))) return true;
      return false;
    },
    [admin]
  );

  // Login action
  const login = async (identifierOrEmail: string, pass: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifierOrEmail, email: identifierOrEmail, password: pass }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setAdmin(json.user);
        return { success: true, redirectUrl: json.redirectUrl };
      } else {
        return { success: false, error: json.error || "Login failed" };
      }
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setAdmin(null);
      router.push("/admin-login");
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        hasPermission,
        login,
        logout,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
