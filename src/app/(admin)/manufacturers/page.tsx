import React from "react";
import { prisma } from "@/lib/prisma";
import { ManufacturersClient, ManufacturerRecord } from "./ManufacturersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manufacturer Management | Admin Catalog",
  description: "Configure manufacturing entities, legal corporate entities, regulatory compliance licenses, and production addresses.",
};

export default async function ManufacturersPage() {
  let initialData: ManufacturerRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalManufacturers: 0,
    activeManufacturers: 0,
    inactiveManufacturers: 0,
  };

  try {
    const [manufacturers, count, activeCount] = await Promise.all([
      prisma.manufacturer.findMany({
        orderBy: { companyName: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.manufacturer.count(),
      prisma.manufacturer.count({ where: { isActive: true } }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;
    metrics = {
      totalManufacturers: count,
      activeManufacturers: activeCount,
      inactiveManufacturers: count - activeCount,
    };

    initialData = manufacturers.map((m) => ({
      id: m.id,
      code: m.code,
      companyName: m.companyName,
      registrationNo: m.registrationNo,
      email: m.email,
      phone: m.phone,
      address: m.address,
      countryOfOrigin: m.countryOfOrigin,
      isActive: m.isActive,
      createdAt: m.createdAt.toISOString(),
      _count: {
        products: m._count.products,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch manufacturers SSR data:", err);
  }

  return (
    <ManufacturersClient
      initialData={initialData}
      initialPagination={{
        totalItems,
        totalPages,
        currentPage: 1,
        pageSize: 10,
      }}
      initialMetrics={metrics}
    />
  );
}
