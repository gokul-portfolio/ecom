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
  SlidersHorizontal,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  GitMerge,
  Filter,
  Search,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Ruler,
} from "lucide-react";

export interface AttributeRecord {
  id: string;
  code: string;
  name: string;
  dataType: "TEXT" | "NUMBER" | "BOOLEAN" | "SINGLE_SELECT" | "MULTI_SELECT" | "MEASUREMENT" | "DATE";
  allowedOptions: string[];
  unitGroup?: string | null;
  defaultUnit?: string | null;
  isFilterable: boolean;
  isSearchable: boolean;
  isVariantAxis: boolean;
  isActive: boolean;
  createdAt: string;
  _count: {
    categoryMappings: number;
    attributeValues: number;
  };
}

interface AttributesClientProps {
  initialData?: AttributeRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalAttributes: number;
    variantAxes: number;
    filterableAttributes: number;
  };
}

export function AttributesClient({
  initialData,
  initialPagination,
  initialMetrics,
}: AttributesClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite =
    hasPermission("attributes:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");
  const canDelete =
    hasPermission("attributes:delete") ||
    hasPermission("catalog:delete") ||
    hasPermission("*");

  // Server-side Table Controller with SWR caching, SSR initialData, and live Socket.IO sync
  const {
    data: attributes,
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
  } = useServerTable<AttributeRecord>({
    endpoint: "/api/admin/attributes",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "attributes:changed",
    initialData,
    initialPagination,
  });

  const [viewTarget, setViewTarget] = useState<AttributeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttributeRecord | null>(null);

  // Table Keyboard Navigation
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<AttributeRecord>({
    data: attributes,
    onAdd: () => {
      if (canWrite) {
        router.push("/attributes/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/attributes/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteAttribute = async () => {
    if (!deleteTarget || isSubmitting) return;

    if (deleteTarget._count.attributeValues > 0) {
      toast.error(
        "Cannot Delete",
        `Attribute "${deleteTarget.name}" has ${deleteTarget._count.attributeValues} values stored on existing products.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/attributes/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete attribute");
      }

      toast.success("Attribute Removed", `Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Deletion Blocked", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDataTypeBadge = (type: AttributeRecord["dataType"]) => {
    switch (type) {
      case "TEXT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Type className="w-3 h-3 text-slate-500" />
            Text
          </span>
        );
      case "NUMBER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
            <Hash className="w-3 h-3 text-blue-500" />
            Number
          </span>
        );
      case "BOOLEAN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
            <ToggleLeft className="w-3 h-3 text-amber-500" />
            Boolean
          </span>
        );
      case "SINGLE_SELECT":
      case "MULTI_SELECT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">
            <SlidersHorizontal className="w-3 h-3 text-purple-500" />
            {type === "SINGLE_SELECT" ? "Single Select" : "Multi Select"}
          </span>
        );
      case "MEASUREMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
            <Ruler className="w-3 h-3 text-emerald-500" />
            Measurement
          </span>
        );
      case "DATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
            <Calendar className="w-3 h-3 text-indigo-500" />
            Date
          </span>
        );
    }
  };

  // TanStack Table Columns
  const columns: ColumnDef<AttributeRecord>[] = [
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
      header: "Attribute Name",
      cell: ({ row }) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {row.original.name}
          </span>
          {row.original.defaultUnit && (
            <span className="text-[11px] text-slate-400">
              Unit: {row.original.defaultUnit} ({row.original.unitGroup || "Standard"})
            </span>
          )}
        </div>
      ),
    },
    {
      id: "dataType",
      accessorKey: "dataType",
      header: "Data Type",
      cell: ({ row }) => getDataTypeBadge(row.original.dataType),
    },
    {
      id: "isVariantAxis",
      accessorKey: "isVariantAxis",
      header: "Variant Matrix Axis",
      cell: ({ row }) =>
        row.original.isVariantAxis ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <GitMerge className="w-3 h-3 text-indigo-600" />
            Variant Axis
          </span>
        ) : (
          <span className="text-xs text-slate-400">Specification Only</span>
        ),
    },
    {
      id: "options",
      header: "Allowed Values / Options",
      cell: ({ row }) => {
        const options = row.original.allowedOptions || [];
        if (options.length === 0) {
          return <span className="text-xs text-slate-400">—</span>;
        }

        return (
          <div className="flex items-center gap-1 flex-wrap max-w-xs">
            {options.slice(0, 3).map((opt, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
              >
                {opt}
              </span>
            ))}
            {options.length > 3 && (
              <span className="text-[10px] text-slate-400 font-medium">
                +{options.length - 3} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "flags",
      header: "Storefront Capabilities",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-xs">
          {row.original.isFilterable && (
            <span
              title="Faceted Filter Sidebar Enabled"
              className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
            >
              <Filter className="w-3 h-3" />
              Filterable
            </span>
          )}
          {row.original.isSearchable && (
            <span
              title="Search Indexing Enabled"
              className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400"
            >
              <Search className="w-3 h-3" />
              Searchable
            </span>
          )}
          {!row.original.isFilterable && !row.original.isSearchable && (
            <span className="text-slate-400">—</span>
          )}
        </div>
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
            title="View Attribute Details (Enter)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span className="sr-only">View</span>
          </button>

          {canWrite && (
            <Link
              href={`/attributes/form?id=${row.original.id}`}
              title="Edit Attribute (Ctrl+E)"
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
              title="Delete Attribute (Delete)"
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
            <SlidersHorizontal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Attribute Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dynamic technical specifications, Cartesian variant axes, and faceted search filters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canWrite && (
            <Link href="/attributes/form">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Attribute
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable
        columns={columns}
        data={attributes}
        isLoading={isLoading}
        searchPlaceholder="Search attributes by name..."
        exportFileName="attributes-definitions"
        canExport={hasPermission("attributes:export") || hasPermission("catalog:export") || hasPermission("*")}
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
          title={`Attribute Details: ${viewTarget.name}`}
          size="md"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {viewTarget.name}
                  {getDataTypeBadge(viewTarget.dataType)}
                </h3>
                <span className="font-mono text-slate-500 text-[11px] mt-0.5">
                  Code: {viewTarget.code}
                </span>
              </div>
              <div>
                {viewTarget.isVariantAxis && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Variant Axis
                  </span>
                )}
              </div>
            </div>

            {viewTarget.allowedOptions && viewTarget.allowedOptions.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium block mb-2">
                  Predefined Allowed Options ({viewTarget.allowedOptions.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.allowedOptions.map((opt, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Categories Mapped</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget._count.categoryMappings} categories
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Product Records Using</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget._count.attributeValues} values stored
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Link href={`/attributes/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit Attribute
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
          onDelete={handleDeleteAttribute}
          itemName={deleteTarget.name}
          title={`Delete Attribute "${deleteTarget.name}"?`}
          message={
            deleteTarget._count.attributeValues > 0
              ? `Warning: Attribute "${deleteTarget.name}" is used in ${deleteTarget._count.attributeValues} product records. Deleting it will corrupt existing product specifications.`
              : `Are you sure you want to permanently delete attribute "${deleteTarget.name}"?`
          }
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
