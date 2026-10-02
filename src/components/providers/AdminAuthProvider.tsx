"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface AdminUserSession {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  department: {
    code: string;
    name: string;
  };
  role: {
    slug: string;
    name: string;
    isSystem: boolean;
    permissions: string[];
  };
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

  // Permission evaluation helper
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!admin) return false;
      const perms = admin.role.permissions || [];
      // Wildcard grants all permissions
      if (perms.includes("*")) return true;
      return perms.includes(permission);
    },
    [admin]
  );

  // Login action
  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
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
