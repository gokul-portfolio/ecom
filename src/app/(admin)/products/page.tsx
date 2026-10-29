import React from "react";
import { prisma } from "@/lib/prisma";
import { ProductsClient, ProductRecord } from "./ProductsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Catalog Management | Admin",
  description: "Manage universal merchandise products, Cartesian variant matrices, pricing, media galleries, and inventory levels.",
};

export default async function ProductsPage() {
  let initialData: ProductRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    lowStockProducts: 0,
  };

  try {
    const [products, count, publishedCount, draftCount] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          manufacturer: {
            select: { id: true, companyName: true },
          },
          taxClass: {
            select: { id: true, name: true, rate: true },
          },
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          media: {
            orderBy: [{ isThumbnail: "desc" }, { sortOrder: "asc" }],
            take: 1,
          },
          variants: {
            select: {
              id: true,
              sku: true,
              price: true,
              inventoryBalances: {
                select: {
                  onHand: true,
                  reserved: true,
                  available: true,
                  lowStockThreshold: true,
                },
              },
            },
          },
          _count: {
            select: {
              variants: true,
              media: true,
              attributeValues: true,
            },
          },
        },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { status: "DRAFT" } }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;

    initialData = products.map((p) => {
      let totalStock = 0;
      let isLowStock = false;

      p.variants.forEach((v) => {
        v.inventoryBalances.forEach((ib) => {
          totalStock += ib.available;
          if (ib.available <= ib.lowStockThreshold) {
            isLowStock = true;
          }
        });
      });

      const primaryCat = p.categories.find((c) => c.isPrimary) || p.categories[0];

      return {
        id: p.id,
        code: p.code,
        title: p.title,
        slug: p.slug,
        productType: p.productType,
        status: p.status,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice,
        thumbnailUrl: p.media[0]?.url || null,
        brandName: p.brand?.name || null,
        primaryCategoryName: primaryCat?.category.name || null,
        variantCount: p._count.variants,
        totalStock,
        isLowStock,
        createdAt: p.createdAt.toISOString(),
      };
    });

    metrics = {
      totalProducts: count,
      publishedProducts: publishedCount,
      draftProducts: draftCount,
      lowStockProducts: initialData.filter((p) => p.isLowStock).length,
    };
  } catch (err) {
    console.error("Failed to prefetch products SSR data:", err);
  }

  return (
    <ProductsClient
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
