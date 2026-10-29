"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { Modal, DeleteConfirmDialog } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  Sparkles,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  Package,
  Layers,
  Flag,
  Award,
} from "lucide-react";

export interface BrandRecord {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  countryOfOrigin?: string | null;
  isActive: boolean;
  logoUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  _count: {
    products: number;
  };
}

interface BrandsClientProps {
  initialData?: BrandRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalBrands: number;
    activeBrands: number;
    inactiveBrands: number;
  };
}

export function BrandsClient({
  initialData,
  initialPagination,
  initialMetrics,
}: BrandsClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite = hasPermission("brands:write") || hasPermission("catalog:write") || hasPermission("*");
  const canDelete = hasPermission("brands:delete") || hasPermission("catalog:delete") || hasPermission("*");

  // Server-side Table Controller with SWR caching, SSR initialData, and live Socket.IO sync
  const {
    data: brands,
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
  } = useServerTable<BrandRecord>({
    endpoint: "/api/admin/brands",
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    socketEventName: "brands:changed",
    initialData,
    initialPagination,
  });

  const [viewTarget, setViewTarget] = useState<BrandRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandRecord | null>(null);

  // Table Keyboard Navigation
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<BrandRecord>({
    data: brands,
    onAdd: () => {
      if (canWrite) {
        router.push("/brands/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/brands/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteBrand = async () => {
    if (!deleteTarget || isSubmitting) return;

    if (deleteTarget._count.products > 0) {
      toast.error(
        "Cannot Delete",
        `Brand "${deleteTarget.name}" has ${deleteTarget._count.products} assigned products. Reassign products first.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/brands/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete brand");
      }

      toast.success("Brand Removed", `Deleted "${deleteTarget.name}".`);
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error("Deletion Blocked", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TanStack Table Column Definitions
  const columns: ColumnDef<BrandRecord>[] = [
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
      id: "logo",
      header: "Brand Identity",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden relative shrink-0 shadow-sm">
            {row.original.logoUrl ? (
              <Image
                src={row.original.logoUrl}
                alt={row.original.name}
                fill
                className="object-contain p-1"
                sizes="36px"
              />
            ) : (
              <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {row.original.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {row.original.name}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              /{row.original.slug}
            </span>
          </div>
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
      id: "website",
      header: "Website",
      cell: ({ row }) =>
        row.original.website ? (
          <a
            href={row.original.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Globe className="w-3 h-3" />
            Visit
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      id: "products",
      header: "Catalog Items",
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
            title="View Brand Details (Enter)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span className="sr-only">View</span>
          </button>

          {canWrite && (
            <Link
              href={`/brands/form?id=${row.original.id}`}
              title="Edit Brand (Ctrl+E)"
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
              title="Delete Brand (Delete)"
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
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Brand Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure marketing brands, designer labels, country affiliations, and storefront logos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canWrite && (
            <Link href="/brands/form">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Brand
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TanStack DataTable */}
      <DataTable
        columns={columns}
        data={brands}
        isLoading={isLoading}
        searchPlaceholder="Search brands by name..."
        exportFileName="brands-catalog"
        canExport={hasPermission("brands:export") || hasPermission("catalog:export") || hasPermission("*")}
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
          title={`Brand Details: ${viewTarget.name}`}
          size="md"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative shrink-0">
                {viewTarget.logoUrl ? (
                  <Image
                    src={viewTarget.logoUrl}
                    alt={viewTarget.name}
                    fill
                    className="object-contain p-1.5"
                  />
                ) : (
                  <span className="font-bold text-lg text-indigo-600">
                    {viewTarget.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {viewTarget.name}
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  Code: {viewTarget.code} • Slug: /{viewTarget.slug}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Origin: {viewTarget.countryOfOrigin || "India"}
                </span>
              </div>
            </div>

            {viewTarget.description && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Brand Story</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {viewTarget.description}
                </p>
              </div>
            )}

            {/* Google SERP Preview */}
            <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Storefront SEO Preview
              </span>
              <p className="text-blue-600 dark:text-blue-400 font-medium text-xs mt-1">
                {viewTarget.metaTitle || `${viewTarget.name} - Shop Official Products`}
              </p>
              <p className="text-emerald-700 dark:text-emerald-500 text-[11px] font-mono">
                https://yourdomain.com/brand/{viewTarget.slug}
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                {viewTarget.metaDescription || "Shop authentic items from this brand."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Link href={`/brands/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit Brand
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
          onDelete={handleDeleteBrand}
          itemName={deleteTarget.name}
          title={`Delete Brand "${deleteTarget.name}"?`}
          message={
            deleteTarget._count.products > 0
              ? `Warning: Brand "${deleteTarget.name}" is associated with ${deleteTarget._count.products} products. You cannot delete it until all products are reassigned.`
              : `Are you sure you want to permanently delete brand "${deleteTarget.name}"?`
          }
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
