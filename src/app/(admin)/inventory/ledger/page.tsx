import React from "react";
import { prisma } from "@/lib/prisma";
import { LedgerClient, StockMovementRecord, WarehouseOption } from "./LedgerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stock Movement Ledger & Audit Trail | Admin Fulfillment",
  description: "Auditable double-entry record of all inventory receipts, dispatches, damages, returns, and transfer events.",
};

export default async function StockLedgerPage() {
  let initialData: StockMovementRecord[] = [];
  let warehouses: WarehouseOption[] = [];
  let metrics = {
    totalMovements: 0,
    receiptsCount: 0,
    deductionsCount: 0,
    adjustmentsCount: 0,
  };

  try {
    const [movements, totalCount, receiptsCount, deductionsCount, adjustmentsCount, warehouseList] =
      await Promise.all([
        prisma.stockMovement.findMany({
          skip: 0,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            variant: {
              include: {
                product: {
                  select: { title: true, code: true, slug: true },
                },
              },
            },
            fromWarehouse: { select: { id: true, name: true, code: true } },
            toWarehouse: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.stockMovement.count(),
        prisma.stockMovement.count({
          where: { type: { in: ["PURCHASE_RECEIPT", "CUSTOMER_RETURN"] } },
        }),
        prisma.stockMovement.count({
          where: { type: { in: ["SALE_DEDUCTION", "DAMAGED_WRITE_OFF"] } },
        }),
        prisma.stockMovement.count({
          where: { type: { in: ["MANUAL_AUDIT_CORRECTION", "WAREHOUSE_TRANSFER"] } },
        }),
        prisma.warehouse.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        }),
      ]);

    metrics = {
      totalMovements: totalCount,
      receiptsCount,
      deductionsCount,
      adjustmentsCount,
    };

    warehouses = warehouseList;

    initialData = movements.map((m) => ({
      id: m.id,
      variantId: m.variantId,
      type: m.type,
      quantity: m.quantity,
      referenceNumber: m.referenceNumber,
      reason: m.reason,
      fromWarehouseId: m.fromWarehouseId,
      toWarehouseId: m.toWarehouseId,
      actorId: m.actorId,
      createdAt: m.createdAt.toISOString(),
      variant: {
        sku: m.variant.sku,
        title: m.variant.title,
        product: {
          title: m.variant.product.title,
          code: m.variant.product.code,
          slug: m.variant.product.slug,
        },
      },
      fromWarehouse: m.fromWarehouse
        ? {
            id: m.fromWarehouse.id,
            name: m.fromWarehouse.name,
            code: m.fromWarehouse.code,
          }
        : null,
      toWarehouse: m.toWarehouse
        ? {
            id: m.toWarehouse.id,
            name: m.toWarehouse.name,
            code: m.toWarehouse.code,
          }
        : null,
    }));
  } catch (err) {
    console.error("[STOCK_LEDGER_SSR_ERROR]", err);
  }

  return (
    <LedgerClient
      initialData={initialData}
      initialMetrics={metrics}
      warehouses={warehouses}
    />
  );
}
