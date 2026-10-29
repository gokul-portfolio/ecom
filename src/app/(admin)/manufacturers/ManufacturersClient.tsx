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
  Factory,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Flag,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export interface ManufacturerRecord {
  id: string;
  code: string;
  companyName: string;
  registrationNo?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  countryOfOrigin?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    products: number;
  };
}

interface ManufacturersClientProps {
  initialData?: ManufacturerRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalManufacturers: number;
    activeManufacturers: number;
    inactiveManufacturers: number;
  };
}

export function ManufacturersClient({
  initialData,
  initialPagination,
  initialMetrics,
}: ManufacturersClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite =
    hasPermission("manufacturers:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");
  const canDelete =
    hasPermission("manufacturers:delete") ||
    hasPermission("catalog:delete") ||
    hasPermission("*");

  // Server-side Table Controller with SWR caching, SSR initialData, and live Socket.IO sync
  const {
    data: manufacturers,
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
  } = useServerTable<ManufacturerRecord>({
    endpoint: "/api/admin/manufacturers",
    defaultSortBy: "companyName",
    defaultSortOrder: "asc",
    socketEventName: "manufacturers:changed",
    initialData,
    initialPagination,
  });

  const [viewTarget, setViewTarget] = useState<ManufacturerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManufacturerRecord | null>(null);

  // Table Keyboard Navigation
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<ManufacturerRecord>({
    data: manufacturers,
    onAdd: () => {
      if (canWrite) {
        router.push("/manufacturers/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/manufacturers/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteManufacturer = async () => {
    if (!deleteTarget || isSubmitting) return;

    if (deleteTarget._count.products > 0) {
      toast.error(
        "Cannot Delete",
        `Manufacturer "${deleteTarget.companyName}" is associated with ${deleteTarget._count.products} products.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/manufacturers/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete manufacturer");
      }

      toast.success("Manufacturer Removed", `Deleted "${deleteTarget.companyName}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Deletion Blocked", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Columns
  const columns: ColumnDef<ManufacturerRecord>[] = [
    {
      id: "code",
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {row.original.code}
        </span>
      ),
    },
    {
      id: "companyName",
      accessorKey: "companyName",
      header: "Manufacturer / Company Name",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-indigo-500" />
            {row.original.companyName}
          </span>
          {row.original.registrationNo && (
            <span className="text-[11px] font-mono text-slate-400">
              Reg: {row.original.registrationNo}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "contact",
      header: "Support & Contacts",
      cell: ({ row }) => (
        <div className="flex flex-col text-left text-xs gap-0.5">
          {row.original.email && (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Mail className="w-3 h-3 text-slate-400" />
              {row.original.email}
            </span>
          )}
          {row.original.phone && (
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              {row.original.phone}
            </span>
          )}
          {!row.original.email && !row.original.phone && (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      id: "countryOfOrigin",
      accessorKey: "countryOfOrigin",
      header: "Origin",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Flag className="w-3 h-3 text-slate-400" />
          {row.original.countryOfOrigin || "India"}
        </span>
      ),
    },
    {
      id: "products",
      header: "Assigned Products",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-semibold">
          <Package className="w-3.5 h-3.5 text-blue-500" />
          {row.original._count.products} products
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
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewTarget(row.original)}
            title="View Manufacturer Details (Enter)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span className="sr-only">View</span>
          </button>

          {canWrite && (
            <Link
              href={`/manufacturers/form?id=${row.original.id}`}
              title="Edit Manufacturer (Ctrl+E)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 dark:hover:text-amber-400 transition-colors inline-flex items-center cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit</span>
            </Link>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteTarget(row.original)}
              title="Delete Manufacturer (Delete)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete</span>
            </button>
          )}
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Factory className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manufacturer Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manufacturing entities, corporate compliance registrations, and factory facilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canWrite && (
            <Link href="/manufacturers/form">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Manufacturer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable
        columns={columns}
        data={manufacturers}
        isLoading={isLoading}
        searchPlaceholder="Search manufacturers by name..."
        exportFileName="manufacturers-catalog"
        canExport={hasPermission("manufacturers:export") || hasPermission("catalog:export") || hasPermission("*")}
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

      {/* View Details Modal */}
      {viewTarget && (
        <Modal
          isOpen={Boolean(viewTarget)}
          onClose={() => setViewTarget(null)}
          title={`Manufacturer Details: ${viewTarget.companyName}`}
          size="md"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
                <Factory className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {viewTarget.companyName}
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  Code: {viewTarget.code}
                </span>
                {viewTarget.registrationNo && (
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Registration No / CIN: {viewTarget.registrationNo}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Support Email</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {viewTarget.email || "Not Provided"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Support Phone</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {viewTarget.phone || "Not Provided"}
                </p>
              </div>
            </div>

            {viewTarget.address && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Registered Address
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {viewTarget.address}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Link href={`/manufacturers/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit Manufacturer
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDeleteManufacturer}
          itemName={deleteTarget.companyName}
          title={`Delete Manufacturer "${deleteTarget.companyName}"?`}
          message={
            deleteTarget._count.products > 0
              ? `Warning: Manufacturer "${deleteTarget.companyName}" produces ${deleteTarget._count.products} products. You cannot delete it until all products are reassigned.`
              : `Are you sure you want to permanently delete manufacturer "${deleteTarget.companyName}"?`
          }
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
