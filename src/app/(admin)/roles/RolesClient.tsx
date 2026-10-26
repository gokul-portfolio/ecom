"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { Modal, DeleteConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  ShieldCheck,
  Building2,
  Users,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Lock,
  KeyRound,
  X,
  ExternalLink,
} from "lucide-react";

export interface RoleRecord {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystem: boolean;
  departmentId: string;
  permissions: string[];
  createdAt: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    staff: number;
  };
}

interface RolesClientProps {
  initialData?: RoleRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
}

export function RolesClient({
  initialData,
  initialPagination,
}: RolesClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  // Server-side Table Controller with SWR client caching, SSR initialData, and live Socket.io sync
  const {
    data: roles,
    isLoading,
    isSubmitting,
    setIsSubmitting,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    search,
    setSearch,
    sortBy,
    sortOrder,
    toggleSort,
    refetch,
  } = useServerTable<RoleRecord>({
    endpoint: "/api/admin/roles",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "roles:changed",
    initialData,
    initialPagination,
  });

  // State for View Details Modal
  const [viewTarget, setViewTarget] = useState<RoleRecord | null>(null);

  // State for Delete Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  // Enterprise Table Keyboard Navigation: ArrowUp/Down to navigate rows, Enter to View, Ctrl+E/e to Edit, Delete/d to Delete, Insert/Alt+N to Add
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<RoleRecord>({
    data: roles,
    onAdd: () => {
      if (hasPermission("roles:manage") || hasPermission("*")) {
        router.push("/roles/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (hasPermission("roles:manage") || hasPermission("*")) {
        router.push(`/roles/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (!item.isSystem && (hasPermission("roles:manage") || hasPermission("*"))) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteRole = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/roles/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete role");
      }

      toast.success("Role Deleted", `Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Cannot Delete", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Columns
  const columns: ColumnDef<RoleRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Role Title",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {row.original.name}
            </span>
            {row.original.isSystem && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                System
              </span>
            )}
          </div>
          {row.original.description && (
            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          {row.original.department?.name || "Unassigned"}
        </span>
      ),
    },
    {
      id: "permissionsCount",
      header: "Capabilities",
      cell: ({ row }) => {
        const perms = Array.isArray(row.original.permissions) ? row.original.permissions : [];
        const isWildcard = perms.includes("*");

        return (
          <Link
            href={`/permissions?roleId=${row.original.id}`}
            title="Open permissions matrix for this role"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3 h-3 text-indigo-500" />
            <span>{isWildcard ? "Full System (*)" : `${perms.length} Granted`}</span>
          </Link>
        );
      },
    },
    {
      id: "staff",
      header: "Assigned Staff",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          {row.original._count?.staff ?? 0} member{row.original._count?.staff === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const canWrite = hasPermission("roles:manage") || hasPermission("*");
        const canDelete = !row.original.isSystem && (hasPermission("roles:manage") || hasPermission("*"));

        return (
          <div className="flex items-center gap-1">
            {/* View Icon Button */}
            <button
              type="button"
              onClick={() => setViewTarget(row.original)}
              title="View Role Details (Enter)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">View</span>
            </button>

            {/* Permissions Matrix Shortcut */}
            <Link
              href={`/permissions?roleId=${row.original.id}`}
              title="Configure Permissions Matrix"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors inline-flex items-center cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span className="sr-only">Permissions</span>
            </Link>

            {/* Edit Icon Button */}
            {canWrite && (
              <Link
                href={`/roles/form?id=${row.original.id}`}
                title="Edit Role (Ctrl+E)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition-colors inline-flex items-center cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Edit</span>
              </Link>
            )}

            {/* Delete Icon Button */}
            {canDelete ? (
              <button
                type="button"
                onClick={() => setDeleteTarget(row.original)}
                title="Delete Role (Delete)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete</span>
              </button>
            ) : row.original.isSystem ? (
              <span
                title="System role protected from deletion"
                className="p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            ) : null}
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <div className="space-y-6 pb-20 text-left">
        {/* Header Breadcrumb & Quick Cross-Module Action Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Role Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Define organizational roles, hierarchy titles, and department allocations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/departments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Departments</span>
            </Link>

            <Link
              href="/shifts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Shifts</span>
            </Link>

            <Link
              href="/permissions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Permissions Matrix</span>
            </Link>

            {(hasPermission("roles:manage") || hasPermission("*")) && (
              <Link href="/roles/form">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Staff Role
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Clean, Unified TanStack Data Table */}
        <DataTable
          columns={columns}
          data={roles}
          isLoading={isLoading}
          searchPlaceholder="Search roles by title, key, or department..."
          exportFileName="roles-catalog"
          canExport={hasPermission("roles:export") || hasPermission("*")}
          searchValue={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={toggleSort}
          selectedIndex={selectedIndex}
          onSelectRowIndex={selectIndex}
          serverPagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            pageSize: pageSize,
            pageSizeOptions: [5, 10, 20, 50],
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
          }}
        />
      </div>

      {/* Modern Executive View Details Modal */}
      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        showCloseButton={false}
        size="lg"
        className="dark:bg-[#0b1120] border-slate-200 dark:border-slate-800"
      >
        {viewTarget && (
          <div className="space-y-6 text-left py-1">
            {/* Header Profile Section with Integrated Close X Button */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Purple/Indigo Avatar Block */}
                <div className="w-11 h-11 rounded-xl bg-indigo-600 dark:bg-indigo-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md">
                  {viewTarget.name.charAt(0).toUpperCase()}
                </div>

                {/* Title & Identifiers */}
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {viewTarget.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 lowercase">
                      {viewTarget.slug}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        viewTarget.isSystem
                          ? "bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80"
                          : "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80"
                      }`}
                    >
                      {viewTarget.isSystem ? "System Protected" : "Custom Role"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close X Button */}
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                suppressHydrationWarning
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                BASIC INFORMATION
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Role Title</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    {viewTarget.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Department</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    {viewTarget.department?.name || "UNASSIGNED"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Staff Members</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    {viewTarget._count?.staff ?? 0} {viewTarget._count?.staff === 1 ? "MEMBER" : "MEMBERS"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Configured Capabilities</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {viewTarget.permissions?.includes("*")
                      ? "Full System Access (*)"
                      : `${viewTarget.permissions?.length || 0} Permissions Granted`}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: SCOPE & RESPONSIBILITIES */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                OPERATIONAL SCOPE & RESPONSIBILITIES
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                <div className="flex items-start justify-between py-2.5 gap-4">
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Description</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-right leading-relaxed max-w-md">
                    {viewTarget.description || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Link
                href={`/permissions?roleId=${viewTarget.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Configure Permissions Matrix</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !isSubmitting && setDeleteTarget(null)}
        onDelete={handleDeleteRole}
        itemName={deleteTarget?.name || "Role"}
        isLoading={isSubmitting}
      />
    </>
  );
}
