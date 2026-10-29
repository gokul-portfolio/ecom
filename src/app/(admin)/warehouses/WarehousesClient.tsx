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
  Warehouse,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Layers,
  AlertTriangle,
  Building,
} from "lucide-react";

export interface WarehouseRecord {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  pincode?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    inventoryBalances: number;
    lowStockAlerts: number;
  };
}

interface WarehousesClientProps {
  initialData?: WarehouseRecord[];
  initialMetrics?: {
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
  };
}

export function WarehousesClient({
  initialData,
  initialMetrics,
}: WarehousesClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite =
    hasPermission("inventory:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");
  const canDelete =
    hasPermission("inventory:delete") ||
    hasPermission("catalog:delete") ||
    hasPermission("*");

  const {
    data: warehouses,
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
  } = useServerTable<WarehouseRecord>({
    endpoint: "/api/admin/warehouses",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "warehouses:changed",
    initialData,
  });

  const [viewTarget, setViewTarget] = useState<WarehouseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WarehouseRecord | null>(null);

  // Table Keyboard Navigation
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<WarehouseRecord>({
    data: warehouses,
    onAdd: () => {
      if (canWrite) {
        router.push("/warehouses/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/warehouses/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteWarehouse = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/warehouses/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete warehouse");
      }

      toast.success("Warehouse Removed", `Deleted "${deleteTarget.name}".`);
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
  const columns: ColumnDef<WarehouseRecord>[] = [
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
      id: "name",
      accessorKey: "name",
      header: "Fulfillment Center Name",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Warehouse className="w-3.5 h-3.5 text-indigo-500" />
            {row.original.name}
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {[row.original.city, row.original.state, row.original.country]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      ),
    },
    {
      id: "holdings",
      header: "Inventory Holdings",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          {row.original._count.inventoryBalances} SKUs stocked
        </span>
      ),
    },
    {
      id: "contact",
      header: "Facility Phone",
      cell: ({ row }) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
          {row.original.contactPhone || "—"}
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
            title="View Warehouse Details (Enter)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span className="sr-only">View</span>
          </button>

          {canWrite && (
            <Link
              href={`/warehouses/form?id=${row.original.id}`}
              title="Edit Warehouse (Ctrl+E)"
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
              title="Delete Warehouse (Delete)"
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
            <Warehouse className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Warehouse Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure physical fulfillment hubs, distribution centers, and localized store stock locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canWrite && (
            <Link href="/warehouses/form">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Warehouse
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable
        columns={columns}
        data={warehouses}
        isLoading={isLoading}
        searchPlaceholder="Search warehouses by name..."
        exportFileName="warehouses-list"
        canExport={hasPermission("inventory:export") || hasPermission("catalog:export") || hasPermission("*")}
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
          title={`Warehouse: ${viewTarget.name}`}
          size="md"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 shrink-0">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {viewTarget.name}
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  Code: {viewTarget.code}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  {viewTarget.city}, {viewTarget.state} - {viewTarget.pincode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Stocked SKUs</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget._count.inventoryBalances} product variants
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Dispatch Phone</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.contactPhone || "None"}
                </p>
              </div>
            </div>

            {viewTarget.address && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-0.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Address Location
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
                <Link href={`/warehouses/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit Warehouse
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
          onDelete={handleDeleteWarehouse}
          itemName={deleteTarget.name}
          title={`Delete Warehouse "${deleteTarget.name}"?`}
          message={`Are you sure you want to permanently delete warehouse "${deleteTarget.name}"? This will be blocked if any active stock is held in this facility.`}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
