"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useServerTable } from "@/hooks/useServerTable";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/components/ui/feedback/Toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  Boxes,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  History,
  ArrowRight,
  Filter,
  Copy,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";

export interface InventoryBalanceRecord {
  id: string;
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  updatedAt: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
    city?: string | null;
  };
  variant: {
    id: string;
    sku: string;
    barcode?: string | null;
    title: string;
    price: number;
    attributes: Record<string, string>;
    product: {
      id: string;
      title: string;
      code: string;
      slug: string;
      basePrice: number;
    };
  };
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
  city?: string;
}

interface InventoryClientProps {
  initialData?: InventoryBalanceRecord[];
  initialMetrics?: {
    totalTrackedSkus: number;
    unacknowledgedAlerts: number;
    totalAvailableUnits: number;
    totalWarehouses: number;
  };
  warehouses: WarehouseOption[];
}

export function InventoryClient({
  initialData,
  initialMetrics,
  warehouses,
}: InventoryClientProps) {
  const { hasPermission } = useAdminAuth();
  const toast = useToast();

  const canWrite =
    hasPermission("inventory:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  // Filters state
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [isLowStockFilter, setIsLowStockFilter] = useState<boolean>(false);

  const {
    data: balances,
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
  } = useServerTable<InventoryBalanceRecord>({
    endpoint: "/api/admin/inventory",
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    socketEventName: "inventory:changed",
    initialData,
    extraParams: {
      warehouseId: selectedWarehouse !== "all" ? selectedWarehouse : undefined,
      isLowStock: isLowStockFilter ? "true" : undefined,
    },
  });

  // Stock Adjustment Modal State
  const [adjustTarget, setAdjustTarget] = useState<InventoryBalanceRecord | null>(null);
  const [adjustType, setAdjustType] = useState<string>("PURCHASE_RECEIPT");
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReference, setAdjustReference] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Keyboard navigation for table
  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<InventoryBalanceRecord>({
    data: balances,
    onView: (item) => {
      if (canWrite) {
        setAdjustTarget(item);
      }
    },
  });

  // Calculate projected stock
  const calculateProjectedStock = () => {
    if (!adjustTarget) return { onHand: 0, available: 0 };
    const qty = Number(adjustQty) || 0;
    let delta = 0;

    switch (adjustType) {
      case "PURCHASE_RECEIPT":
      case "CUSTOMER_RETURN":
        delta = qty;
        break;
      case "SALE_DEDUCTION":
      case "DAMAGED_WRITE_OFF":
        delta = -qty;
        break;
      case "MANUAL_AUDIT_CORRECTION":
        return {
          onHand: qty,
          available: Math.max(0, qty - adjustTarget.reserved),
        };
      default:
        delta = 0;
    }

    const projectedOnHand = Math.max(0, adjustTarget.onHand + delta);
    const projectedAvailable = Math.max(0, projectedOnHand - adjustTarget.reserved);
    return { onHand: projectedOnHand, available: projectedAvailable };
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    if (adjustQty === undefined || isNaN(adjustQty)) {
      setAdjustError("Please specify a valid quantity.");
      return;
    }

    setIsSubmitting(true);
    setAdjustError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: adjustTarget.variantId,
          warehouseId: adjustTarget.warehouseId,
          type: adjustType,
          quantity: Number(adjustQty),
          referenceNumber: adjustReference.trim() || undefined,
          reason: adjustReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to adjust stock.");
      }

      toast.success(
        "Stock Adjusted Successfully",
        `Updated balance for ${adjustTarget.variant.sku} at ${adjustTarget.warehouse.name}.`
      );
      setAdjustTarget(null);
      setAdjustReference("");
      setAdjustReason("");
      setAdjustQty(10);
      refetch();
    } catch (err: any) {
      setAdjustError(err.message || "An unexpected error occurred.");
      toast.error("Adjustment Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard", text);
  };

  // Table Columns Definition
  const columns: ColumnDef<InventoryBalanceRecord>[] = [
    {
      accessorKey: "sku",
      header: "SKU & Barcode",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-primary">
              <span>{item.variant.sku}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(item.variant.sku)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy SKU"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            {item.variant.barcode && (
              <span className="font-mono text-[11px] text-muted-foreground">
                {item.variant.barcode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Product & Variant",
      cell: ({ row }) => {
        const item = row.original;
        const attrEntries = Object.entries(item.variant.attributes || {});
        return (
          <div className="flex flex-col gap-0.5 max-w-[260px]">
            <span className="font-medium text-sm text-foreground line-clamp-1">
              {item.variant.product.title}
            </span>
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {attrEntries.length > 0 ? (
                attrEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-medium"
                  >
                    {k}: {v}
                  </span>
                ))
              ) : (
                <span className="text-[11px] italic">Base Item</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse Hub",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">
              {item.warehouse.name}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="font-mono uppercase px-1 py-0.2 rounded bg-muted/50 text-[10px]">
                {item.warehouse.code}
              </span>
              {item.warehouse.city && <span>• {item.warehouse.city}</span>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "onHand",
      header: "On Hand",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className="font-semibold text-sm tabular-nums text-foreground">
            {item.onHand.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "reserved",
      header: "Reserved",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span
            className={`text-xs tabular-nums ${
              item.reserved > 0
                ? "text-amber-500 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {item.reserved.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "available",
      header: "Available",
      cell: ({ row }) => {
        const item = row.original;
        const isLow = item.available <= item.lowStockThreshold;
        const isOut = item.available <= 0;

        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold text-sm tabular-nums ${
                isOut
                  ? "text-rose-500"
                  : isLow
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            >
              {item.available.toLocaleString()}
            </span>
            {isLow && (
              <span
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                  isOut
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                {isOut ? "Out" : "Low"}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "lowStockThreshold",
      header: "Threshold",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs text-muted-foreground tabular-nums">
            <span>Min: {item.lowStockThreshold} units</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {canWrite && (
              <button
                onClick={() => setAdjustTarget(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                title="Adjust Stock"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
            <Link
              href={`/inventory/ledger?search=${encodeURIComponent(item.variant.sku)}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="View stock history ledger"
            >
              <History className="w-4 h-4" />
            </Link>
          </div>
        );
      },
    },
  ];

  const projected = calculateProjectedStock();

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Inventory Balances
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time multi-warehouse stock balances, low-stock warnings, and atomic stock adjustments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory/ledger">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
            >
              Stock Ledger
            </Button>
          </Link>
          <Link href="/warehouses">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Warehouse className="w-4 h-4" />}
            >
              Warehouses ({warehouses.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Selector */}
          <div className="flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="all">All Warehouses ({warehouses.length})</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle Button */}
          <Button
            variant={isLowStockFilter ? "primary" : "outline"}
            size="sm"
            onClick={() => setIsLowStockFilter((prev) => !prev)}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Filter className="w-3.5 h-3.5" />
            {isLowStockFilter ? "Showing Low Stock Only" : "Filter Low Stock"}
          </Button>

          {(selectedWarehouse !== "all" || isLowStockFilter || search) && (
            <button
              onClick={() => {
                setSelectedWarehouse("all");
                setIsLowStockFilter(false);
                setSearch("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh inventory balances (Alt+R)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main DataTable */}
      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={balances}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search SKU, barcode, product, or warehouse... (/ to focus)"
          selectedIndex={selectedIndex}
          onSelectRowIndex={selectIndex}
          serverPagination={{
            currentPage: page,
            totalPages,
            totalItems,
            pageSize,
            pageSizeOptions: [10, 20, 50, 100],
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
          onSort={(col) => toggleSort(col)}
        />
      </div>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title="Adjust Inventory Stock"
        size="lg"
      >
        {adjustTarget && (
          <form onSubmit={handleAdjustSubmit} className="space-y-5">
            {/* Target Variant Banner */}
            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">
                    {adjustTarget.variant.sku}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                    {adjustTarget.variant.product.title}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-foreground block">
                    {adjustTarget.warehouse.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground uppercase">
                    {adjustTarget.warehouse.code}
                  </span>
                </div>
              </div>

              {/* Current Balances Row */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">On Hand</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums">
                    {adjustTarget.onHand}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Reserved</span>
                  <span className="font-medium text-amber-500 text-sm tabular-nums">
                    {adjustTarget.reserved}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Available</span>
                  <span className="font-bold text-emerald-500 text-sm tabular-nums">
                    {adjustTarget.available}
                  </span>
                </div>
              </div>
            </div>

            {/* Adjustment Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Movement / Adjustment Reason Type *
              </label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value)}
                className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="PURCHASE_RECEIPT">
                  (+) PURCHASE_RECEIPT: Receive Supplier Inventory
                </option>
                <option value="SALE_DEDUCTION">
                  (-) SALE_DEDUCTION: Manual Sale / Dispatch Deduction
                </option>
                <option value="CUSTOMER_RETURN">
                  (+) CUSTOMER_RETURN: Restock Customer Return
                </option>
                <option value="DAMAGED_WRITE_OFF">
                  (-) DAMAGED_WRITE_OFF: Defective / Damaged / Expired Loss
                </option>
                <option value="MANUAL_AUDIT_CORRECTION">
                  (=) MANUAL_AUDIT_CORRECTION: Physical Cycle Count Override
                </option>
              </select>
            </div>

            {/* Quantity Input with Quick Stepper Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                  {adjustType === "MANUAL_AUDIT_CORRECTION"
                    ? "New Physical Count (Exact Total)"
                    : "Units Delta (Quantity to Add or Deduct) *"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {adjustType === "SALE_DEDUCTION" || adjustType === "DAMAGED_WRITE_OFF"
                    ? "Will deduct from balance"
                    : adjustType === "MANUAL_AUDIT_CORRECTION"
                    ? "Direct override"
                    : "Will add to balance"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground font-semibold tabular-nums focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Enter unit count..."
                  required
                />
                <div className="flex items-center gap-1">
                  {[5, 10, 25, 50, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setAdjustQty(step)}
                      className="px-2 py-1 text-xs border border-border rounded bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      +{step}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reference Number & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Reference No. (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReference}
                  onChange={(e) => setAdjustReference(e.target.value)}
                  placeholder="e.g., PO-2026-081, RMA-492"
                  className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g., Annual warehouse cycle count"
                  className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Projected Stock Preview */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                Projected Balance After Movement
              </span>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">On Hand:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {adjustTarget.onHand}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-bold text-primary tabular-nums">
                    {projected.onHand}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {adjustTarget.available}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span
                    className={`font-bold tabular-nums ${
                      projected.available <= adjustTarget.lowStockThreshold
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {projected.available}
                  </span>
                </div>
              </div>
            </div>

            {adjustError && (
              <p className="text-xs text-rose-500 font-medium">{adjustError}</p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustTarget(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting}
              >
                Confirm Stock Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
