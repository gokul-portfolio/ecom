"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/feedback/Toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardNavigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSidebar } from "@/hooks/useSidebar";
import {
  PERMISSION_MATRIX_REGISTRY,
  ALL_SYSTEM_PERMISSIONS,
  PermissionModuleGroup,
  SubModulePermission,
  PermissionAction,
} from "@/config/permissions";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  LayoutDashboard,
  Building2,
  ShoppingBag,
  Boxes,
  ShoppingCart,
  Users,
  Settings,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Lock,
  Search,
  Check,
  Zap,
  Copy,
  SlidersHorizontal,
  ExternalLink,
  Plus,
  Filter,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  permissions: string[];
  department?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    staff: number;
  };
}

interface PermissionsClientProps {
  initialRoles: RoleOption[];
}

export function PermissionsClient({ initialRoles }: PermissionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRoleId = searchParams.get("roleId");
  const { hasPermission: checkUserPerm } = useAdminAuth();
  const canManageRoles = checkUserPerm("roles:manage") || checkUserPerm("*");
  const { isCollapsed } = useSidebar();
  const { socket } = useSocket();
  const toast = useToast();

  const [roles, setRoles] = useState<RoleOption[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => {
    if (queryRoleId && initialRoles.some((r) => r.id === queryRoleId)) {
      return queryRoleId;
    }
    return initialRoles[0]?.id || "";
  });

  // Real-time synchronization when roles are updated across tabs
  useEffect(() => {
    if (!socket) return;
    const handleRolesChanged = async () => {
      try {
        const res = await fetch("/api/admin/roles?limit=100");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRoles(
            json.data.map((r: any) => ({
              id: r.id,
              name: r.name,
              slug: r.slug,
              description: r.description,
              isSystem: r.isSystem,
              permissions: Array.isArray(r.permissions) ? r.permissions : [],
              department: r.department,
              _count: r._count,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to re-fetch roles on socket event", err);
      }
    };

    socket.on("roles:changed", handleRolesChanged);
    return () => {
      socket.off("roles:changed", handleRolesChanged);
    };
  }, [socket]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    PERMISSION_MATRIX_REGISTRY[0]?.id || "dashboard"
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"tabbed" | "all">("tabbed");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isCloneModalOpen, setIsCloneModalOpen] = useState<boolean>(false);
  const [cloneSourceRoleId, setCloneSourceRoleId] = useState<string>("");

  // Update selected role if URL query changes
  useEffect(() => {
    if (queryRoleId && roles.some((r) => r.id === queryRoleId)) {
      setSelectedRoleId(queryRoleId);
    }
  }, [queryRoleId, roles]);

  // Active Role & Working Permissions State
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  const [workingPermissions, setWorkingPermissions] = useState<string[]>([]);
  const [isWildcard, setIsWildcard] = useState<boolean>(false);

  // Sync working permissions whenever selected role changes
  useEffect(() => {
    if (selectedRole) {
      const perms = Array.isArray(selectedRole.permissions)
        ? selectedRole.permissions
        : [];
      setWorkingPermissions(perms);
      setIsWildcard(perms.includes("*"));
    }
  }, [selectedRole]);

  // Unique departments for filtering
  const departmentsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    roles.forEach((r) => {
      if (r.department) {
        map.set(r.department.id, { id: r.department.id, name: r.department.name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [roles]);

  // Filtered roles by department
  const filteredRoles = useMemo(() => {
    if (departmentFilter === "all") return roles;
    return roles.filter((r) => r.department?.id === departmentFilter);
  }, [roles, departmentFilter]);

  // Active Category Group
  const activeCategory = useMemo(
    () =>
      PERMISSION_MATRIX_REGISTRY.find((g) => g.id === activeCategoryId) ||
      PERMISSION_MATRIX_REGISTRY[0],
    [activeCategoryId]
  );

  // Filtered sub-modules based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return PERMISSION_MATRIX_REGISTRY;
    }
    const q = searchQuery.toLowerCase().trim();
    return PERMISSION_MATRIX_REGISTRY.map((group) => {
      const matchingSubs = group.subModules.filter(
        (sub) =>
          sub.name.toLowerCase().includes(q) ||
          sub.code.toLowerCase().includes(q) ||
          sub.description.toLowerCase().includes(q) ||
          Object.values(sub.supportedActions).some((actKey) =>
            actKey?.toLowerCase().includes(q)
          )
      );
      return {
        ...group,
        subModules: matchingSubs,
      };
    }).filter((group) => group.subModules.length > 0);
  }, [searchQuery]);

  // Icon Resolver
  const getCategoryIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "LayoutDashboard":
        return <LayoutDashboard className={className} />;
      case "Building2":
        return <Building2 className={className} />;
      case "ShoppingBag":
        return <ShoppingBag className={className} />;
      case "Boxes":
        return <Boxes className={className} />;
      case "ShoppingCart":
        return <ShoppingCart className={className} />;
      case "Users":
        return <Users className={className} />;
      case "Settings":
        return <Settings className={className} />;
      default:
        return <Shield className={className} />;
    }
  };

  // Helper: check if a single permission key is active
  const hasPermission = useCallback(
    (key: string): boolean => {
      if (isWildcard) return true;
      return workingPermissions.includes(key);
    },
    [isWildcard, workingPermissions]
  );

  // Helper: toggle a single permission key
  const togglePermissionKey = (key: string) => {
    if (!key || !canManageRoles) return;
    if (isWildcard) {
      const allExcept = ALL_SYSTEM_PERMISSIONS.filter((p) => p !== key);
      setIsWildcard(false);
      setWorkingPermissions(allExcept);
      return;
    }

    setWorkingPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  // Helper: check if all actions for a submodule are selected
  const isSubModuleFullySelected = (sub: SubModulePermission): boolean => {
    if (isWildcard) return true;
    const actions = Object.values(sub.supportedActions).filter(Boolean) as string[];
    if (actions.length === 0) return false;
    return actions.every((actKey) => workingPermissions.includes(actKey));
  };

  // Helper: toggle all actions for a single submodule
  const toggleSubModuleAll = (sub: SubModulePermission) => {
    if (!canManageRoles) return;
    const actionKeys = Object.values(sub.supportedActions).filter(Boolean) as string[];
    if (actionKeys.length === 0) return;

    if (isWildcard) {
      setIsWildcard(false);
      setWorkingPermissions(ALL_SYSTEM_PERMISSIONS.filter((p) => !actionKeys.includes(p)));
      return;
    }

    const allCurrentlySelected = actionKeys.every((k) => workingPermissions.includes(k));

    if (allCurrentlySelected) {
      setWorkingPermissions((prev) => prev.filter((p) => !actionKeys.includes(p)));
    } else {
      setWorkingPermissions((prev) => Array.from(new Set([...prev, ...actionKeys])));
    }
  };

  // Helper: check if all actions across a category group are active
  const isCategoryFullySelected = (group: PermissionModuleGroup): boolean => {
    if (isWildcard) return true;
    const allGroupKeys = group.subModules.flatMap((sub) =>
      Object.values(sub.supportedActions).filter(Boolean) as string[]
    );
    if (allGroupKeys.length === 0) return false;
    return allGroupKeys.every((k) => workingPermissions.includes(k));
  };

  // Helper: toggle all permissions across a category
  const toggleCategoryAll = (group: PermissionModuleGroup) => {
    if (!canManageRoles) return;
    const allGroupKeys = group.subModules.flatMap((sub) =>
      Object.values(sub.supportedActions).filter(Boolean) as string[]
    );
    if (allGroupKeys.length === 0) return;

    if (isWildcard) {
      setIsWildcard(false);
      setWorkingPermissions(ALL_SYSTEM_PERMISSIONS.filter((p) => !allGroupKeys.includes(p)));
      return;
    }

    const allCurrentlySelected = allGroupKeys.every((k) => workingPermissions.includes(k));

    if (allCurrentlySelected) {
      setWorkingPermissions((prev) => prev.filter((p) => !allGroupKeys.includes(p)));
    } else {
      setWorkingPermissions((prev) => Array.from(new Set([...prev, ...allGroupKeys])));
    }
  };

  // Helper: check if a specific action column across the active category is active
  const isColumnFullySelected = (action: PermissionAction, group = activeCategory): boolean => {
    if (isWildcard) return true;
    const colKeys = group.subModules
      .map((sub) => sub.supportedActions[action])
      .filter(Boolean) as string[];

    if (colKeys.length === 0) return false;
    return colKeys.every((k) => workingPermissions.includes(k));
  };

  // Helper: toggle a whole action column in the category
  const toggleColumnAll = (action: PermissionAction, group = activeCategory) => {
    if (!canManageRoles) return;
    const colKeys = group.subModules
      .map((sub) => sub.supportedActions[action])
      .filter(Boolean) as string[];

    if (colKeys.length === 0) return;

    if (isWildcard) {
      setIsWildcard(false);
      setWorkingPermissions(ALL_SYSTEM_PERMISSIONS.filter((p) => !colKeys.includes(p)));
      return;
    }

    const allCurrentlySelected = colKeys.every((k) => workingPermissions.includes(k));

    if (allCurrentlySelected) {
      setWorkingPermissions((prev) => prev.filter((p) => !colKeys.includes(p)));
    } else {
      setWorkingPermissions((prev) => Array.from(new Set([...prev, ...colKeys])));
    }
  };

  // Quick Preset: Wildcard (* Full System Access)
  const toggleWildcard = () => {
    if (!canManageRoles) return;
    if (isWildcard) {
      setIsWildcard(false);
      setWorkingPermissions([]);
    } else {
      setIsWildcard(true);
      setWorkingPermissions(["*"]);
    }
  };

  // Quick Preset: Read-Only (All Read Permissions)
  const applyReadOnlyPreset = () => {
    if (!canManageRoles) return;
    setIsWildcard(false);
    const readKeys: string[] = [];
    PERMISSION_MATRIX_REGISTRY.forEach((group) => {
      group.subModules.forEach((sub) => {
        if (sub.supportedActions.read) {
          readKeys.push(sub.supportedActions.read);
        }
      });
    });
    setWorkingPermissions(Array.from(new Set(readKeys)));
    toast.info("Read-Only Preset Applied", "Configured view-only access across all system modules.");
  };

  // Quick Preset: Operations / CRUD (Read + Create + Update)
  const applyStandardOpsPreset = () => {
    if (!canManageRoles) return;
    setIsWildcard(false);
    const opsKeys: string[] = [];
    PERMISSION_MATRIX_REGISTRY.forEach((group) => {
      group.subModules.forEach((sub) => {
        if (sub.supportedActions.read) opsKeys.push(sub.supportedActions.read);
        if (sub.supportedActions.create) opsKeys.push(sub.supportedActions.create);
        if (sub.supportedActions.update) opsKeys.push(sub.supportedActions.update);
      });
    });
    setWorkingPermissions(Array.from(new Set(opsKeys)));
    toast.info("Operations Preset Applied", "Configured Read, Create, and Edit access across all modules.");
  };

  // Quick Preset: Clear All
  const clearAllPermissions = () => {
    if (!canManageRoles) return;
    setIsWildcard(false);
    setWorkingPermissions([]);
    toast.info("Permissions Cleared", "Removed all active capability permissions.");
  };

  // Clone from another role
  const handleCloneFromRole = () => {
    if (!cloneSourceRoleId || !canManageRoles) return;
    const source = roles.find((r) => r.id === cloneSourceRoleId);
    if (!source) return;

    const sourcePerms = Array.isArray(source.permissions) ? source.permissions : [];
    setIsWildcard(sourcePerms.includes("*"));
    setWorkingPermissions(sourcePerms);
    setIsCloneModalOpen(false);
    toast.success(
      "Permissions Cloned",
      `Copied ${sourcePerms.length} capabilities from "${source.name}".`
    );
  };

  // Calculate completion stats per category for progress badges
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; active: number; percentage: number }> = {};

    for (const group of PERMISSION_MATRIX_REGISTRY) {
      const allKeys = group.subModules.flatMap((sub) =>
        Object.values(sub.supportedActions).filter(Boolean) as string[]
      );
      const total = allKeys.length;
      if (total === 0) {
        stats[group.id] = { total: 0, active: 0, percentage: 0 };
        continue;
      }

      const active = isWildcard
        ? total
        : allKeys.filter((k) => workingPermissions.includes(k)).length;
      const percentage = Math.round((active / total) * 100);
      stats[group.id] = { total, active, percentage };
    }

    return stats;
  }, [workingPermissions, isWildcard]);

  // Total active capabilities across entire system
  const totalActiveCapabilities = useMemo(() => {
    if (isWildcard) return ALL_SYSTEM_PERMISSIONS.length;
    return workingPermissions.length;
  }, [workingPermissions, isWildcard]);

  // Detect unsaved changes
  const hasChanges = useMemo(() => {
    if (!selectedRole) return false;
    const initialPerms = selectedRole.permissions || [];
    if (isWildcard && initialPerms.includes("*")) return false;
    if (isWildcard !== initialPerms.includes("*")) return true;

    if (workingPermissions.length !== initialPerms.length) return true;
    const sortedA = [...workingPermissions].sort();
    const sortedB = [...initialPerms].sort();
    return sortedA.some((val, idx) => val !== sortedB[idx]);
  }, [selectedRole, workingPermissions, isWildcard]);

  // Reset to role's saved permissions
  const handleReset = () => {
    if (!selectedRole) return;
    const perms = selectedRole.permissions || [];
    setWorkingPermissions(perms);
    setIsWildcard(perms.includes("*"));
    toast.info("Policy Reverted", `Reverted changes for "${selectedRole.name}".`);
  };

  // Save Policy to Backend API
  const handleSavePolicy = async () => {
    if (!selectedRole || isSaving || !canManageRoles) return;

    setIsSaving(true);
    const finalPermissions = isWildcard ? ["*"] : workingPermissions;

    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: finalPermissions,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update role permissions");
      }

      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRole.id ? { ...r, permissions: finalPermissions } : r
        )
      );

      toast.success(
        "Access Policy Saved",
        `Security permissions for "${selectedRole.name}" updated successfully.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error("Save Error", msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard Shortcuts: Ctrl+S / Cmd+S / F2 = Save, F4 = Reset, Esc = Navigate to Roles
  useKeyboardShortcuts(
    {
      "f2": (e) => {
        e.preventDefault();
        handleSavePolicy();
      },
      "ctrl+s, meta+s": (e) => {
        e.preventDefault();
        handleSavePolicy();
      },
      "f4": (e) => {
        e.preventDefault();
        handleReset();
      },
      "escape": () => {
        router.push("/roles");
      },
    },
    { enableInInputs: true, preventDefault: true }
  );

  // Render Matrix Table for a category
  const renderCategoryMatrixTable = (category: PermissionModuleGroup) => {
    const isCatAll = isCategoryFullySelected(category);

    return (
      <div
        key={category.id}
        className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden flex flex-col mb-6 last:mb-0"
      >
        {/* Category Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-200 dark:border-indigo-800">
              {getCategoryIcon(category.iconName, "w-5 h-5")}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {category.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {category.subModules.length} Modules
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {category.description}
              </p>
            </div>
          </div>

          {/* Master Category Select All Toggle */}
          <button
            type="button"
            disabled={!canManageRoles}
            onClick={() => toggleCategoryAll(category)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 self-start sm:self-auto",
              isCatAll
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50",
              !canManageRoles && "opacity-60 cursor-not-allowed"
            )}
          >
            {isCatAll ? (
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All in Domain</span>
          </button>
        </div>

        {/* Matrix Grid Table */}
        <div className="overflow-x-auto min-h-[160px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3.5 min-w-[220px]">PAGE / MODULE</th>

                {/* Column Header: List / View */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("read", category)}
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all View permissions"
                  >
                    <span>VIEW</span>
                    {isColumnFullySelected("read", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Create / Add */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("create", category)}
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all Create permissions"
                  >
                    <span>CREATE</span>
                    {isColumnFullySelected("create", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Edit / Update */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("update", category)}
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all Edit permissions"
                  >
                    <span>EDIT</span>
                    {isColumnFullySelected("update", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Delete */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("delete", category)}
                    className="inline-flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all Delete permissions"
                  >
                    <span className="text-rose-500">DELETE</span>
                    {isColumnFullySelected("delete", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Export */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("export", category)}
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all Export permissions"
                  >
                    <span>EXPORT</span>
                    {isColumnFullySelected("export", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Notify / Comm */}
                <th className="px-3 py-3.5 text-center whitespace-nowrap">
                  <button
                    type="button"
                    disabled={!canManageRoles}
                    onClick={() => toggleColumnAll("notify", category)}
                    className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Toggle all Notification permissions"
                  >
                    <span>NOTIFY</span>
                    {isColumnFullySelected("notify", category) ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                </th>

                {/* Column Header: Row Master Toggle */}
                <th className="px-4 py-3.5 text-center whitespace-nowrap font-black text-indigo-600 dark:text-indigo-400">
                  ALL
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {category.subModules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No matching sub-modules in this domain.
                  </td>
                </tr>
              ) : (
                category.subModules.map((sub) => {
                  const isRowAll = isSubModuleFullySelected(sub);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Sub-module Details */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {sub.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400">
                              {sub.code}
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              • {sub.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action: View / Read */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.read ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.read)}
                            onChange={() => togglePermissionKey(sub.supportedActions.read!)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Action: Create / Add */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.create ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.create)}
                            onChange={() => togglePermissionKey(sub.supportedActions.create!)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Action: Edit / Update */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.update ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.update)}
                            onChange={() => togglePermissionKey(sub.supportedActions.update!)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Action: Delete */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.delete ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.delete)}
                            onChange={() => togglePermissionKey(sub.supportedActions.delete!)}
                            className="w-4 h-4 rounded border-rose-300 dark:border-rose-800/80 dark:bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Action: Export */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.export ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.export)}
                            onChange={() => togglePermissionKey(sub.supportedActions.export!)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Action: Notify */}
                      <td className="px-3 py-3.5 text-center">
                        {sub.supportedActions.notify ? (
                          <input
                            type="checkbox"
                            disabled={!canManageRoles}
                            checked={hasPermission(sub.supportedActions.notify)}
                            onChange={() => togglePermissionKey(sub.supportedActions.notify!)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 select-none font-bold">—</span>
                        )}
                      </td>

                      {/* Row Master Toggle (ALL) */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          disabled={!canManageRoles}
                          checked={isRowAll}
                          onChange={() => toggleSubModuleAll(sub)}
                          className="w-4 h-4 rounded border-indigo-300 dark:border-indigo-700 dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                          title="Toggle all actions for this page"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-8 text-left">
      {/* Clean Top Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Admin
        </Link>
        <span>/</span>
        <Link href="/roles" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Organization
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-slate-200 font-bold">Role Permissions Matrix</span>
      </div>

      {/* Unified Master Card: Housing Header, Filters, Presets, Search, Matrix Table & Docked Footer */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] shadow-sm overflow-hidden transition-colors">
        {/* Section 1: Top Header & Role Selectors */}
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Header Title & Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Role Permissions Matrix
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure granular operational permissions, data isolation, and administrative governance policies per role.
                </p>
              </div>
            </div>
          </div>

          {/* Target Role Selector & Global Active Count (Clean vertical label-over-input alignment) */}
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            {/* Department Filter */}
            {departmentsList.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                  DEPT FILTER
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none cursor-pointer min-w-[180px]"
                >
                  <option value="all">All Departments ({roles.length})</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Role Dropdown (Generous Width, Clean Border) */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                TARGET ROLE
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="h-10 px-3.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none cursor-pointer min-w-[260px] sm:min-w-[340px]"
              >
                {filteredRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.department ? `(${r.department.name})` : ""} {r.isSystem ? "[System Protected]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Active Capabilities Pill */}
            <div className="flex flex-col gap-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                ACTIVE CAPABILITIES
              </label>
              <div className="h-10 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-1.5 font-bold text-xs whitespace-nowrap">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>
                  {isWildcard ? "Full System Access (*)" : `${totalActiveCapabilities} Granted`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Selected Role Context Banner & Quick Preset Controls */}
        {selectedRole && (
          <div className="p-4 sm:px-6 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-500 dark:text-slate-400">
                Configuring Policy for:{" "}
                <strong className="text-slate-900 dark:text-white font-bold">{selectedRole.name}</strong>
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 lowercase border border-slate-200 dark:border-slate-700">
                {selectedRole.slug}
              </span>
              {selectedRole.department && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                  <Building2 className="w-3 h-3 text-indigo-500" />
                  {selectedRole.department.name}
                </span>
              )}
              {selectedRole._count?.staff !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                  <Users className="w-3 h-3 text-emerald-500" />
                  {selectedRole._count.staff} assigned staff
                </span>
              )}
            </div>

            {/* Quick Action Presets Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Presets Button: Wildcard Master Switch */}
              <button
                type="button"
                disabled={!canManageRoles}
                onClick={toggleWildcard}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs",
                  isWildcard
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400",
                  !canManageRoles && "opacity-60 cursor-not-allowed"
                )}
              >
                <Zap className={cn("w-3.5 h-3.5", isWildcard ? "fill-slate-950" : "text-amber-500")} />
                <span>{isWildcard ? "Root Wildcard Active (*)" : "Grant All (*)"}</span>
              </button>

              {/* Preset: Read Only */}
              <button
                type="button"
                disabled={!canManageRoles}
                onClick={applyReadOnlyPreset}
                title="Grant Read-Only permissions on all modules"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Read-Only</span>
              </button>

              {/* Preset: Standard CRUD */}
              <button
                type="button"
                disabled={!canManageRoles}
                onClick={applyStandardOpsPreset}
                title="Grant View, Create, and Edit access across all modules"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                <span>CRUD Ops</span>
              </button>

              {/* Preset: Clone from another role */}
              <button
                type="button"
                disabled={!canManageRoles || roles.length <= 1}
                onClick={() => {
                  setCloneSourceRoleId(roles.find((r) => r.id !== selectedRole.id)?.id || "");
                  setIsCloneModalOpen(true);
                }}
                title="Copy permissions from another role"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                <span>Clone Role</span>
              </button>

              {/* Preset: Clear All */}
              <button
                type="button"
                disabled={!canManageRoles || (!isWildcard && workingPermissions.length === 0)}
                onClick={clearAllPermissions}
                title="Clear all permissions for this role"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Interactive Search & View Switcher Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0c1322]">
          {/* Search Modules Live Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permissions by page name, code, or keyword (e.g. products, roles, delete)..."
              className="w-full h-10 pl-9 pr-8 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Switcher: Tabbed Domain vs All Domains */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0 self-end sm:self-auto border border-slate-200/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("tabbed")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "tabbed"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tabbed Domains</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "all"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>All Domains ({PERMISSION_MATRIX_REGISTRY.length})</span>
            </button>
          </div>
        </div>

        {/* Section 4: Main Workspace Layout (Inside Master Card) */}
        <div className="p-5 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          {viewMode === "all" || searchQuery ? (
            // ALL DOMAINS / SEARCH RESULTS VIEW
            <div className="space-y-6">
              {filteredCategories.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1322]">
                  <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No matching permission modules found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching with a different term like &quot;order&quot;, &quot;catalog&quot;, or &quot;staff&quot;.
                  </p>
                </div>
              ) : (
                filteredCategories.map((group) => renderCategoryMatrixTable(group))
              )}
            </div>
          ) : (
            // TABBED DOMAINS VIEW: Category Vertical Tabs (Left) + Matrix Table (Right)
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Category Navigation Rail (4 cols) */}
              <div className="lg:col-span-4 space-y-2 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0c1322] p-3 shadow-xs">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  SYSTEM DOMAINS ({PERMISSION_MATRIX_REGISTRY.length})
                </div>

                <div className="space-y-1">
                  {PERMISSION_MATRIX_REGISTRY.map((group) => {
                    const isActive = group.id === activeCategoryId;
                    const stats = categoryStats[group.id] || { total: 0, active: 0, percentage: 0 };

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveCategoryId(group.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 cursor-pointer border",
                          isActive
                            ? "bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                            : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-200 dark:border-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              isActive
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {getCategoryIcon(group.iconName, "w-4 h-4")}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-xs font-bold truncate",
                                isActive
                                  ? "text-indigo-950 dark:text-indigo-100"
                                  : "text-slate-800 dark:text-slate-200"
                              )}
                            >
                              {group.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {group.subModules.length} Sub-modules
                            </p>
                          </div>
                        </div>

                        {/* Percentage Pill */}
                        <span
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border",
                            stats.percentage === 100
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              : stats.percentage > 0
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                          )}
                        >
                          {stats.percentage}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Active Category Matrix Table (8 cols) */}
              <div className="lg:col-span-8">
                {renderCategoryMatrixTable(activeCategory)}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Integrated Master Card Docked Footer (NO detached floating capsule) */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#090f1d] p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 border",
                hasChanges
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
              )}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {!canManageRoles
                  ? "Read-Only Security View"
                  : hasChanges
                  ? "Unsaved Policy Changes Pending"
                  : "Policy Synced & Active"}
                {hasChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {!canManageRoles
                  ? "You do not have administrative permission to modify governance policies."
                  : hasChanges
                  ? "Press Ctrl+S / F2 or click Save Changes to apply these security policies immediately."
                  : `Role "${selectedRole?.name}" has ${totalActiveCapabilities} capabilities configured.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || isSaving || !canManageRoles}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              Reset (F4)
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSavePolicy}
              loading={isSaving}
              disabled={!hasChanges || isSaving || !canManageRoles}
              className="font-bold px-5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Save Permissions (Ctrl+S / F2)
            </Button>
          </div>
        </div>
      </div>

      {/* Clone From Role Modal */}
      <Modal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        title="Clone Permissions from Existing Role"
        description="Duplicate all granted security capabilities and policies from another role to the target role."
        size="md"
      >
        <div className="space-y-4 pt-2 text-left">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
            Copying permissions into: <strong>{selectedRole?.name}</strong>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Source Role to Clone From
            </label>
            <select
              value={cloneSourceRoleId}
              onChange={(e) => setCloneSourceRoleId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none cursor-pointer"
            >
              {roles
                .filter((r) => r.id !== selectedRole?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.permissions?.includes("*") ? "All Permissions *" : `${r.permissions?.length || 0} permissions`})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCloneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCloneFromRole}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Apply Cloned Policy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
