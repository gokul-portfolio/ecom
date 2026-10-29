"use client";

import React, { useState, useEffect } from "react";
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
  FolderTree,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Folder,
  Layers,
  Package,
  Globe,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  List,
  GitFork,
  Image as ImageIcon,
} from "lucide-react";

export interface CategoryRecord {
  id: string;
  code: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  iconUrl?: string | null;
  bannerUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  _count: {
    children: number;
    productCategories: number;
    categoryAttributes: number;
  };
}

interface CategoryTreeNode extends CategoryRecord {
  childrenNodes?: CategoryTreeNode[];
}

interface CategoriesClientProps {
  initialData?: CategoryRecord[];
  initialPagination?: {
    totalItems: number;
    totalPages: number;
    currentPage?: number;
    pageSize?: number;
  };
  initialMetrics?: {
    totalCategories: number;
    rootCategories: number;
    subcategories: number;
    activeCategories: number;
  };
}

export function CategoriesClient({
  initialData,
  initialPagination,
  initialMetrics,
}: CategoriesClientProps) {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite = hasPermission("categories:write") || hasPermission("catalog:write") || hasPermission("*");
  const canDelete = hasPermission("categories:delete") || hasPermission("catalog:delete") || hasPermission("*");

  // Dual view mode: "table" | "tree"
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  // Tree view data state
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  // Server-side Table Controller with SWR caching, SSR initialData, and live Socket.IO sync
  const {
    data: categories,
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
  } = useServerTable<CategoryRecord>({
    endpoint: "/api/admin/categories",
    defaultSortBy: "sortOrder",
    defaultSortOrder: "asc",
    socketEventName: "categories:changed",
    initialData,
    initialPagination,
  });

  // State for View Details Modal
  const [viewTarget, setViewTarget] = useState<CategoryRecord | null>(null);

  // State for Delete Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null);

  // Table Keyboard Navigation: ArrowUp/Down to navigate, Enter to View, e to Edit, d to Delete, Insert/Alt+N to Add
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<CategoryRecord>({
    data: categories,
    onAdd: () => {
      if (canWrite) {
        router.push("/categories/form");
      }
    },
    onView: (item) => setViewTarget(item),
    onEdit: (item) => {
      if (canWrite) {
        router.push(`/categories/form?id=${item.id}`);
      }
    },
    onDelete: (item) => {
      if (canDelete) {
        setDeleteTarget(item);
      }
    },
  });

  // Fetch hierarchical tree data when toggled into tree mode
  useEffect(() => {
    if (viewMode === "tree") {
      let isMounted = true;
      setIsTreeLoading(true);

      fetch("/api/admin/categories?view=tree")
        .then((res) => res.json())
        .then((json) => {
          if (isMounted && json.success) {
            setTreeData(json.data || []);
            // Expand all root nodes by default
            const initialExpanded: Record<string, boolean> = {};
            json.data?.forEach((node: CategoryTreeNode) => {
              initialExpanded[node.id] = true;
            });
            setExpandedNodeIds(initialExpanded);
          }
        })
        .catch((err) => {
          console.error("Failed to load tree data:", err);
          toast.error("Tree Error", "Could not load category tree.");
        })
        .finally(() => {
          if (isMounted) setIsTreeLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [viewMode, toast]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Execute Delete
  const handleDeleteCategory = async () => {
    if (!deleteTarget || isSubmitting) return;

    if (deleteTarget._count.children > 0) {
      toast.error(
        "Cannot Delete",
        `Category "${deleteTarget.name}" has ${deleteTarget._count.children} child subcategories. Delete or move them first.`
      );
      return;
    }

    if (deleteTarget._count.productCategories > 0) {
      toast.error(
        "Cannot Delete",
        `Category "${deleteTarget.name}" is assigned to ${deleteTarget._count.productCategories} products.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete category");
      }

      toast.success("Category Removed", `Deleted "${deleteTarget.name}".`);
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
  const columns: ColumnDef<CategoryRecord>[] = [
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
      id: "icon",
      header: "Visual",
      cell: ({ row }) => (
        <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 overflow-hidden relative">
          {row.original.iconUrl ? (
            <Image
              src={row.original.iconUrl}
              alt={row.original.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          ) : (
            <Folder className="w-4 h-4 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: "Category Name & Slug",
      cell: ({ row }) => {
        const indentClass =
          row.original.level === 0
            ? ""
            : row.original.level === 1
            ? "pl-4 border-l-2 border-indigo-400"
            : "pl-8 border-l-2 border-indigo-300";

        return (
          <div className={`flex flex-col text-left py-0.5 ${indentClass}`}>
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              {row.original.level > 0 && (
                <GitFork className="w-3 h-3 text-slate-400 rotate-90" />
              )}
              {row.original.name}
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              /{row.original.slug}
            </span>
          </div>
        );
      },
    },
    {
      id: "parent",
      header: "Parent Taxonomy",
      cell: ({ row }) => (
        <div className="text-left text-xs">
          {row.original.parent ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <FolderTree className="w-3 h-3 text-indigo-500" />
              {row.original.parent.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              Root Category
            </span>
          )}
        </div>
      ),
    },
    {
      id: "level",
      accessorKey: "level",
      header: "Depth",
      cell: ({ row }) => (
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
          L{row.original.level}
        </span>
      ),
    },
    {
      id: "counts",
      header: "Structure & Items",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-xs">
          <span
            title="Child subcategories"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
          >
            <FolderTree className="w-3.5 h-3.5 text-amber-500" />
            {row.original._count.children}
          </span>
          <span
            title="Products assigned"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-400"
          >
            <Package className="w-3.5 h-3.5 text-blue-500" />
            {row.original._count.productCategories}
          </span>
        </div>
      ),
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            row.original.isActive
              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
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
            title="View Details (Enter)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span className="sr-only">View</span>
          </button>

          {canWrite && (
            <Link
              href={`/categories/form?id=${row.original.id}`}
              title="Edit Category (Ctrl+E)"
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
              title="Delete Category (Delete)"
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

  // Recursive Tree Node Renderer for Tree View
  const renderTreeNode = (node: CategoryTreeNode, depth = 0) => {
    const isExpanded = !!expandedNodeIds[node.id];
    const hasChildren = node.childrenNodes && node.childrenNodes.length > 0;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors my-1 ${
            depth > 0 ? "ml-6" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNodeExpansion(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
            )}

            <div className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden relative flex items-center justify-center">
              {node.iconUrl ? (
                <Image
                  src={node.iconUrl}
                  alt={node.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <Folder className="w-3.5 h-3.5 text-indigo-500" />
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {node.name}
                <span className="font-mono text-[11px] text-slate-400">({node.code})</span>
                {!node.isActive && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.2 rounded font-medium">
                    Inactive
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                /{node.slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              {node._count.children} subcategories • {node._count.productCategories} products
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewTarget(node)}
                className="h-7 w-7 p-0"
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              {canWrite && (
                <Link href={`/categories/form?id=${node.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-indigo-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-slate-200 dark:border-slate-800 ml-3">
            {node.childrenNodes!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Category Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Universal merchandise hierarchy, nested taxonomy tree, and storefront navigation classifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle: Table / Tree */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === "tree"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Tree View
            </button>
          </div>

          {canWrite && (
            <Link href="/categories/form">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Category
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          searchPlaceholder="Search by name, slug, code... (Press / to focus)"
          exportFileName="categories-catalog"
          canExport={hasPermission("categories:export") || hasPermission("catalog:export") || hasPermission("*")}
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
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Taxonomy Hierarchy Tree View
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allExpanded: Record<string, boolean> = {};
                  const markAll = (nodes: CategoryTreeNode[]) => {
                    nodes.forEach((n) => {
                      allExpanded[n.id] = true;
                      if (n.childrenNodes) markAll(n.childrenNodes);
                    });
                  };
                  markAll(treeData);
                  setExpandedNodeIds(allExpanded);
                }}
                className="text-xs h-7"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedNodeIds({})}
                className="text-xs h-7"
              >
                Collapse All
              </Button>
            </div>
          </div>

          <div className="pt-3">
            {isTreeLoading ? (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400">
                Loading category taxonomy tree...
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FolderTree className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">No categories created yet.</p>
              </div>
            ) : (
              treeData.map((rootNode) => renderTreeNode(rootNode, 0))
            )}
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewTarget && (
        <Modal
          isOpen={Boolean(viewTarget)}
          onClose={() => setViewTarget(null)}
          title={`Category Details: ${viewTarget.name}`}
          size="lg"
        >
          <div className="flex flex-col gap-4 p-4 text-xs">
            {/* Visual Banners and Icons */}
            {(viewTarget.bannerUrl || viewTarget.iconUrl) && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {viewTarget.bannerUrl ? (
                  <Image
                    src={viewTarget.bannerUrl}
                    alt={viewTarget.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    No banner configured
                  </div>
                )}
                {viewTarget.iconUrl && (
                  <div className="absolute bottom-2 left-2 w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 shadow-md overflow-hidden relative">
                    <Image
                      src={viewTarget.iconUrl}
                      alt={viewTarget.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Unique Code</span>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {viewTarget.code}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Storefront URL Slug</span>
                <p className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  /category/{viewTarget.slug}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Taxonomy Depth</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  Level {viewTarget.level}{" "}
                  {viewTarget.parent ? `(Child of ${viewTarget.parent.name})` : "(Root Taxonomy)"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Catalog Status</span>
                <p className="font-semibold mt-0.5">
                  {viewTarget.isActive ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Active (Visible)</span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">Inactive (Hidden)</span>
                  )}
                </p>
              </div>
            </div>

            {viewTarget.description && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-400 font-medium">Description</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {viewTarget.description}
                </p>
              </div>
            )}

            {/* SEO Section */}
            {(viewTarget.metaTitle || viewTarget.metaDescription) && (
              <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  SEO Google Preview
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-medium text-xs mt-1">
                  {viewTarget.metaTitle || viewTarget.name} | Storefront
                </p>
                <p className="text-emerald-700 dark:text-emerald-500 text-[11px] font-mono">
                  https://yourdomain.com/category/{viewTarget.slug}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  {viewTarget.metaDescription || "No custom meta description provided."}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setViewTarget(null)}>
                Close
              </Button>
              {canWrite && (
                <Link href={`/categories/form?id=${viewTarget.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Edit Category
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
          onDelete={handleDeleteCategory}
          itemName={deleteTarget.name}
          title={`Delete Category "${deleteTarget.name}"?`}
          message={
            deleteTarget._count.children > 0 || deleteTarget._count.productCategories > 0
              ? `Warning: This category contains ${deleteTarget._count.children} subcategories and ${deleteTarget._count.productCategories} assigned products. You must reassign or remove them before deleting.`
              : `Are you sure you want to permanently delete category "${deleteTarget.name}"? This action cannot be undone.`
          }
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
