import React from "react";
import { prisma } from "@/lib/prisma";
import { BrandsClient, BrandRecord } from "./BrandsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brand Management | Admin Catalog",
  description: "Configure merchandise brands, designer labels, marketing identities, and storefront logos.",
};

export default async function BrandsPage() {
  let initialData: BrandRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalBrands: 0,
    activeBrands: 0,
    inactiveBrands: 0,
  };

  try {
    const [brands, count, activeCount] = await Promise.all([
      prisma.brand.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.brand.count(),
      prisma.brand.count({ where: { isActive: true } }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;
    metrics = {
      totalBrands: count,
      activeBrands: activeCount,
      inactiveBrands: count - activeCount,
    };

    initialData = brands.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      slug: b.slug,
      description: b.description,
      website: b.website,
      countryOfOrigin: b.countryOfOrigin,
      isActive: b.isActive,
      logoUrl: b.logoUrl,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      createdAt: b.createdAt.toISOString(),
      _count: {
        products: b._count.products,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch brands SSR data:", err);
  }

  return (
    <BrandsClient
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
