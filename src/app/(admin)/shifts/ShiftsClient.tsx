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
  Clock,
  Users,
  Building2,
  ShieldCheck,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  KeyRound,
  Timer,
} from "lucide-react";

export interface ShiftRecord {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMins: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    staff: number;
  };
}

interface ShiftsClientProps {
  initialData?: ShiftRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
}

export function ShiftsClient({
  initialData,
  initialPagination,
}: ShiftsClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  // Server-side Table Controller with SWR client-side caching, SSR initialData, and live Socket.io sync
  const {
    data: shifts,
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
  } = useServerTable<ShiftRecord>({
    endpoint: "/api/admin/shifts",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "shifts:changed",
    initialData,
    initialPagination,
  });

  // State for View Details Modal
  const [viewTarget, setViewTarget] = useState<ShiftRecord | null>(null);

  // State for Delete Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState<ShiftRecord | null>(null);

  // Table Keyboard Navigation: ArrowUp/Down to navigate rows, Enter to View, Ctrl+E/e to Edit, Delete/d to Delete, Insert/Alt+N to Add
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<ShiftRecord>({
    data: shifts,
    onAdd: () => {
      if (hasPermission("shifts:write") || hasPermission("departments:write") || hasPermission("*")) {
        router.push("/shifts/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (hasPermission("shifts:write") || hasPermission("departments:write") || hasPermission("*")) {
        router.push(`/shifts/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (hasPermission("shifts:delete") || hasPermission("departments:delete") || hasPermission("*")) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteShift = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/shifts/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete shift");
      }

      toast.success("Shift Removed", `Deleted "${deleteTarget.name}".`);
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
  const columns: ColumnDef<ShiftRecord>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Shift Name & Identifier",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {row.original.name}
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {row.original.code}
            </span>
          </div>
          {row.original.description && (
            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-md mt-0.5">
              {row.original.description}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "timing",
      header: "Working Hours",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 w-fit">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            {row.original.startTime} – {row.original.endTime}
          </span>
        </div>
      ),
    },
    {
      id: "gracePeriod",
      header: "Grace Period",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <Timer className="w-3.5 h-3.5 text-amber-500" />
          {row.original.gracePeriodMins} mins
        </span>
      ),
    },
    {
      id: "staff",
      header: "Assigned Staff",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          {row.original._count?.staff ?? 0} member{row.original._count?.staff === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            row.original.isActive
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              row.original.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const canWrite =
          hasPermission("shifts:write") ||
          hasPermission("departments:write") ||
          hasPermission("*");
        const canDelete =
          hasPermission("shifts:delete") ||
          hasPermission("departments:delete") ||
          hasPermission("*");

        return (
          <div className="flex items-center gap-1">
            {/* View Icon Button */}
            <button
              type="button"
              onClick={() => setViewTarget(row.original)}
              title="View Shift Details (Enter)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span className="sr-only">View</span>
            </button>

            {/* Edit Icon Button */}
            {canWrite && (
              <Link
                href={`/shifts/form?id=${row.original.id}`}
                title="Edit Shift (Ctrl+E)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition-colors inline-flex items-center cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span className="sr-only">Edit</span>
              </Link>
            )}

            {/* Delete Icon Button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget(row.original)}
                title="Delete Shift (Delete)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete</span>
              </button>
            )}
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
              <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Shift Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure organizational operational shifts, timing schedules, and grace periods.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {(hasPermission("shifts:write") ||
              hasPermission("departments:write") ||
              hasPermission("*")) && (
              <Link href="/shifts/form">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Shift
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Clean, Unified TanStack Data Table with Single Integrated Toolbar and Pagination */}
        <DataTable
          columns={columns}
          data={shifts}
          isLoading={isLoading}
          searchPlaceholder="Search shifts by name or code..."
          exportFileName="shifts-catalog"
          canExport={
            hasPermission("shifts:export") ||
            hasPermission("departments:export") ||
            hasPermission("*")
          }
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
                  <Clock className="w-6 h-6" />
                </div>

                {/* Title & Identifiers */}
                <div className="min-w-0">
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase truncate">
                    {viewTarget.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                      {viewTarget.code}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                        viewTarget.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {viewTarget.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close X Button */}
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SECTION 1: TIMING SPECIFICATIONS */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                TIMING & WORKING HOURS
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Shift Start Time</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewTarget.startTime} (24-Hour Format)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Shift End Time</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewTarget.endTime} (24-Hour Format)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Grace Period Allowed</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {viewTarget.gracePeriodMins} Minutes
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Staff Count</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {viewTarget._count?.staff ?? 0} {viewTarget._count?.staff === 1 ? "MEMBER" : "MEMBERS"}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: OPERATIONAL SCOPE */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-400">
                OPERATIONAL SCOPE & POLICIES
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
          </div>
        )}
      </Modal>

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !isSubmitting && setDeleteTarget(null)}
        onDelete={handleDeleteShift}
        itemName={deleteTarget?.name || "Shift"}
        isLoading={isSubmitting}
      />
    </>
  );
}
