import React from "react";
import { prisma } from "@/lib/prisma";
import { InventoryClient, InventoryBalanceRecord, WarehouseOption } from "./InventoryClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory Balances & Stock Control | Admin Fulfillment",
  description: "Real-time stock balances across warehouses, automated low-stock warnings, and atomic stock adjustment controls.",
};

export default async function InventoryPage() {
  let initialData: InventoryBalanceRecord[] = [];
  let warehouses: WarehouseOption[] = [];
  let metrics = {
    totalTrackedSkus: 0,
    unacknowledgedAlerts: 0,
    totalAvailableUnits: 0,
    totalWarehouses: 0,
  };

  try {
    const [balances, totalCount, alertCount, warehouseList, totalUnitsAgg] = await Promise.all([
      prisma.inventoryBalance.findMany({
        skip: 0,
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, city: true },
          },
          variant: {
            include: {
              product: {
                select: { id: true, title: true, code: true, slug: true, basePrice: true },
              },
            },
          },
        },
      }),
      prisma.inventoryBalance.count(),
      prisma.lowStockAlert.count({ where: { isAcknowledged: false } }),
      prisma.warehouse.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, city: true },
        orderBy: { name: "asc" },
      }),
      prisma.inventoryBalance.aggregate({
        _sum: {
          available: true,
        },
      }),
    ]);

    metrics = {
      totalTrackedSkus: totalCount,
      unacknowledgedAlerts: alertCount,
      totalAvailableUnits: totalUnitsAgg._sum.available || 0,
      totalWarehouses: warehouseList.length,
    };

    warehouses = warehouseList.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      city: w.city || undefined,
    }));

    initialData = balances.map((b) => ({
      id: b.id,
      variantId: b.variantId,
      warehouseId: b.warehouseId,
      onHand: b.onHand,
      reserved: b.reserved,
      available: b.available,
      lowStockThreshold: b.lowStockThreshold,
      updatedAt: b.updatedAt.toISOString(),
      warehouse: {
        id: b.warehouse.id,
        name: b.warehouse.name,
        code: b.warehouse.code,
        city: b.warehouse.city,
      },
      variant: {
        id: b.variant.id,
        sku: b.variant.sku,
        barcode: b.variant.barcode,
        title: b.variant.title,
        price: Number(b.variant.price),
        attributes: (b.variant.optionValues as Record<string, string>) || {},
        product: {
          id: b.variant.product.id,
          title: b.variant.product.title,
          code: b.variant.product.code,
          slug: b.variant.product.slug,
          basePrice: Number(b.variant.product.basePrice),
        },
      },
    }));
  } catch (err) {
    console.error("[INVENTORY_PAGE_SSR_ERROR]", err);
  }

  return (
    <InventoryClient
      initialData={initialData}
      initialMetrics={metrics}
      warehouses={warehouses}
    />
  );
}
