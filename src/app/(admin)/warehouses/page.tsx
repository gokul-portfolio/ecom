import React from "react";
import { prisma } from "@/lib/prisma";
import { WarehousesClient, WarehouseRecord } from "./WarehousesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Warehouse Management | Admin Fulfillment",
  description: "Configure central fulfillment centers, distribution hubs, localized physical stores, and stock holdings.",
};

export default async function WarehousesPage() {
  let initialData: WarehouseRecord[] = [];
  let metrics = {
    totalWarehouses: 0,
    activeWarehouses: 0,
    inactiveWarehouses: 0,
  };

  try {
    const [warehouses, count, activeCount] = await Promise.all([
      prisma.warehouse.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              inventoryBalances: true,
              lowStockAlerts: true,
            },
          },
        },
      }),
      prisma.warehouse.count(),
      prisma.warehouse.count({ where: { isActive: true } }),
    ]);

    metrics = {
      totalWarehouses: count,
      activeWarehouses: activeCount,
      inactiveWarehouses: count - activeCount,
    };

    initialData = warehouses.map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      address: w.address,
      city: w.city,
      state: w.state,
      country: w.country,
      pincode: w.pincode,
      contactPhone: w.contactPhone,
      isActive: w.isActive,
      createdAt: w.createdAt.toISOString(),
      _count: {
        inventoryBalances: w._count.inventoryBalances,
        lowStockAlerts: w._count.lowStockAlerts,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch warehouses SSR data:", err);
  }

  return <WarehousesClient initialData={initialData} initialMetrics={metrics} />;
}
