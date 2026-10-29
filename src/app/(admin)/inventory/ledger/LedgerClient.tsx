"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useServerTable } from "@/hooks/useServerTable";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import {
  History,
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
  Warehouse,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export interface StockMovementRecord {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  referenceNumber?: string | null;
  reason?: string | null;
  actorId?: string | null;
  createdAt: string;
  variant: {
    sku: string;
    title: string;
    product: {
      title: string;
      code: string;
      slug: string;
    };
  };
  fromWarehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
  toWarehouse?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface LedgerClientProps {
  initialData?: StockMovementRecord[];
  initialMetrics?: {
    totalMovements: number;
    receiptsCount: number;
    deductionsCount: number;
    adjustmentsCount: number;
  };
  warehouses: WarehouseOption[];
}

export function LedgerClient({
  initialData,
  initialMetrics,
  warehouses,
}: LedgerClientProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  const {
    data: movements,
    isLoading,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
    search,
    setSearch,
    toggleSort,
    refetch,
  } = useServerTable<StockMovementRecord>({
    endpoint: "/api/admin/inventory/ledger",
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    socketEventName: "inventory:changed",
    initialData,
    extraParams: {
      type: selectedType !== "all" ? selectedType : undefined,
      warehouseId: selectedWarehouse !== "all" ? selectedWarehouse : undefined,
    },
  });

  const { selectedIndex, selectIndex } = useTableKeyboardNavigation<StockMovementRecord>({
    data: movements,
  });

  const formatMovementTypeBadge = (type: string) => {
    switch (type) {
      case "PURCHASE_RECEIPT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ArrowDownRight className="w-3 h-3" />
            RECEIPT
          </span>
        );
      case "CUSTOMER_RETURN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-500 border border-teal-500/20">
            <ArrowDownRight className="w-3 h-3" />
            RETURN
          </span>
        );
      case "SALE_DEDUCTION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <ArrowUpRight className="w-3 h-3" />
            SALE
          </span>
        );
      case "DAMAGED_WRITE_OFF":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" />
            DAMAGE
          </span>
        );
      case "WAREHOUSE_TRANSFER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <ArrowRight className="w-3 h-3" />
            TRANSFER
          </span>
        );
      case "MANUAL_AUDIT_CORRECTION":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <SlidersHorizontal className="w-3 h-3" />
            AUDIT
          </span>
        );
    }
  };

  const columns: ColumnDef<StockMovementRecord>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-foreground">
              {date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference & SKU",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-bold text-primary">
              {item.variant.sku}
            </span>
            {item.referenceNumber ? (
              <span className="font-mono text-[11px] text-muted-foreground">
                Ref: {item.referenceNumber}
              </span>
            ) : (
              <span className="text-[11px] italic text-muted-foreground/60">
                Direct adjustment
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "product",
      header: "Product Title",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col max-w-[240px]">
            <span className="font-medium text-sm text-foreground line-clamp-1">
              {item.variant.product.title}
            </span>
            {item.variant.title && (
              <span className="text-xs text-muted-foreground">
                {item.variant.title}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Movement Type",
      cell: ({ row }) => formatMovementTypeBadge(row.original.type),
    },
    {
      accessorKey: "quantity",
      header: "Quantity Delta",
      cell: ({ row }) => {
        const item = row.original;
        const isDeduction =
          item.type === "SALE_DEDUCTION" || item.type === "DAMAGED_WRITE_OFF";
        const isAddition =
          item.type === "PURCHASE_RECEIPT" || item.type === "CUSTOMER_RETURN";

        return (
          <div className="font-semibold text-sm tabular-nums">
            {isAddition && (
              <span className="text-emerald-500">+{item.quantity}</span>
            )}
            {isDeduction && (
              <span className="text-rose-500">-{item.quantity}</span>
            )}
            {!isAddition && !isDeduction && (
              <span className="text-foreground">{item.quantity} units</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse Hub",
      cell: ({ row }) => {
        const item = row.original;
        if (item.type === "WAREHOUSE_TRANSFER" && item.fromWarehouse && item.toWarehouse) {
          return (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-mono px-1.5 py-0.5 rounded bg-muted text-[11px]">
                {item.fromWarehouse.code}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px]">
                {item.toWarehouse.code}
              </span>
            </div>
          );
        }

        const wh = item.toWarehouse || item.fromWarehouse;
        return wh ? (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">{wh.name}</span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              {wh.code}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Central</span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Notes & Reason",
      cell: ({ row }) => {
        const reason = row.original.reason;
        return reason ? (
          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]" title={reason}>
            {reason}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 pb-20 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Stock Movement Ledger
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Immutable, double-entry audit trail tracking inventory receipts, dispatches, damages, and cycle reconciliations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Boxes className="w-4 h-4" />}
            >
              Stock Balances
            </Button>
          </Link>
          <Link href="/warehouses">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Warehouse className="w-4 h-4" />}
            >
              Warehouses
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Movement Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">All Movement Types</option>
            <option value="PURCHASE_RECEIPT">Receipts (PURCHASE_RECEIPT)</option>
            <option value="SALE_DEDUCTION">Dispatches (SALE_DEDUCTION)</option>
            <option value="CUSTOMER_RETURN">Returns (CUSTOMER_RETURN)</option>
            <option value="DAMAGED_WRITE_OFF">Damages (DAMAGED_WRITE_OFF)</option>
            <option value="WAREHOUSE_TRANSFER">Transfers (WAREHOUSE_TRANSFER)</option>
            <option value="MANUAL_AUDIT_CORRECTION">Cycle Audits (MANUAL_AUDIT_CORRECTION)</option>
          </select>

          {/* Warehouse Selector */}
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

          {(selectedType !== "all" || selectedWarehouse !== "all" || search) && (
            <button
              onClick={() => {
                setSelectedType("all");
                setSelectedWarehouse("all");
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
            title="Refresh ledger (Alt+R)"
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
          data={movements}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search reference, SKU, notes, product... (/ to focus)"
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
    </div>
  );
}
