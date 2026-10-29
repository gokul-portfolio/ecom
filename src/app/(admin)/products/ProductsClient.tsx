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
import { cn } from "@/lib/utils";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  Package,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderTree,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  Tag,
  DollarSign,
  TrendingDown,
  Warehouse,
} from "lucide-react";

export interface ProductRecord {
  id: string;
  code: string;
  title: string;
  slug: string;
  productType: "PHYSICAL" | "DIGITAL" | "SERVICE";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  basePrice: number;
  compareAtPrice?: number | null;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  primaryCategoryName?: string | null;
  variantCount: number;
  totalStock: number;
  isLowStock: boolean;
  createdAt: string;
}

interface ProductsClientProps {
  initialData?: ProductRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalProducts: number;
    publishedProducts: number;
    draftProducts: number;
    lowStockProducts: number;
  };
}

export function ProductsClient({
  initialData,
  initialPagination,
  initialMetrics,
}: ProductsClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite =
    hasPermission("products:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");
  const canDelete =
    hasPermission("products:delete") ||
    hasPermission("catalog:delete") ||
    hasPermission("*");

  // Server-side Table Controller with SWR caching, SSR initialData, and live Socket.IO sync
  const {
    data: products,
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
  } = useServerTable<ProductRecord>({
    endpoint: "/api/admin/products",
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    socketEventName: "products:changed",
    initialData,
    initialPagination,
  });

  const [viewTarget, setViewTarget] = useState<ProductRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);

  // Table Keyboard Navigation
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<ProductRecord>({
    data: products,
    onAdd: () => {
      if (canWrite) {
        router.push("/products/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/products/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Execute Delete
  const handleDeleteProduct = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete product");
      }

      toast.success("Product Deleted", `Removed "${deleteTarget.title}".`);
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
  const columns: ColumnDef<ProductRecord>[] = [
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
      id: "thumbnail",
      header: "Visual",
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden relative flex items-center justify-center shrink-0 shadow-sm">
          {row.original.thumbnailUrl ? (
            <Image
              src={row.original.thumbnailUrl}
              alt={row.original.title}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <Package className="w-4 h-4 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      id: "title",
      accessorKey: "title",
      header: "Product Title & Slug",
      cell: ({ row }) => (
        <div className="flex flex-col text-left max-w-xs">
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
            {row.original.title}
          </span>
          <span className="text-[11px] font-mono text-slate-400 truncate">
            /product/{row.original.slug}
          </span>
        </div>
      ),
    },
    {
      id: "taxonomy",
      header: "Classification",
      cell: ({ row }) => (
        <div className="flex flex-col text-left gap-1 text-xs">
          {row.original.primaryCategoryName && (
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <FolderTree className="w-3 h-3 text-indigo-500" />
              {row.original.primaryCategoryName}
            </span>
          )}
          {row.original.brandName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Award className="w-3 h-3 text-amber-500" />
              {row.original.brandName}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "price",
      accessorKey: "basePrice",
      header: "Commercial Price",
      cell: ({ row }) => {
        const hasDiscount =
          row.original.compareAtPrice &&
          row.original.compareAtPrice > row.original.basePrice;

        return (
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
              ₹{row.original.basePrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-[10px] line-through text-slate-400 font-mono">
                ₹{row.original.compareAtPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "variants",
      header: "Variants",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          {row.original.variantCount} SKUs
        </span>
      ),
    },
    {
      id: "inventory",
      header: "Fulfillment Stock",
      cell: ({ row }) => {
        if (row.original.totalStock <= 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              <XCircle className="w-3 h-3" />
              Out of Stock
            </span>
          );
        }

        if (row.original.isLowStock) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              Low: {row.original.totalStock} left
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {row.original.totalStock} units available
          </span>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isPublished = row.original.status === "PUBLISHED";
        const isDraft = row.original.status === "DRAFT";
        return (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
              isPublished
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60"
                : isDraft
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                isPublished ? "bg-emerald-500" : isDraft ? "bg-amber-500" : "bg-slate-400"
              )}
            />
            {isPublished ? "Published" : isDraft ? "Draft" : "Archived"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewTarget(row.original)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {canWrite && (
            <Link
              href={`/products/form?id=${row.original.id}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Edit Product"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}

          {canDelete && (
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Product Catalog
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Universal merchandise catalog, Cartesian variant matrices, pricing tiers, and warehouse fulfillment balances.
              </p>
            </div>
          </div>
        </div>

        {canWrite && (
          <Link href="/products/form">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* TanStack DataTable */}
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search products by title, SKU, barcode, code... (Press / to focus)"
        exportFileName="products-catalog"
        canExport={hasPermission("products:export") || hasPermission("catalog:export") || hasPermission("*")}
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
          title={`Product: ${viewTarget.title}`}
          size="md"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative shrink-0 shadow-sm">
                {viewTarget.thumbnailUrl ? (
                  <Image
                    src={viewTarget.thumbnailUrl}
                    alt={viewTarget.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {viewTarget.title}
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  Code: {viewTarget.code} • Slug: /{viewTarget.slug}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs mt-0.5">
                  ₹{viewTarget.basePrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Category</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.primaryCategoryName || "Uncategorized"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Brand</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.brandName || "Generic"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Variant Matrix</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.variantCount} SKUs configured
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Total Available Stock</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.totalStock} units
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Link href={`/products/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit in Product Builder
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
          onDelete={handleDeleteProduct}
          itemName={deleteTarget.title}
          title={`Delete Product "${deleteTarget.title}"?`}
          message={`Are you sure you want to permanently delete product "${deleteTarget.title}"? This will remove all associated variant SKUs and media.`}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
