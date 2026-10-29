import React from "react";
import { prisma } from "@/lib/prisma";
import { CategoriesClient, CategoryRecord } from "./CategoriesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Category Management | Admin Catalog",
  description: "Configure universal merchandise categories, hierarchical taxonomies, and storefront classifications.",
};

export default async function CategoriesPage() {
  let initialData: CategoryRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalCategories: 0,
    rootCategories: 0,
    subcategories: 0,
    activeCategories: 0,
  };

  try {
    const [categories, count, rootCount, activeCount] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        take: 10,
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              children: true,
              productCategories: true,
              categoryAttributes: true,
            },
          },
        },
      }),
      prisma.category.count(),
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;
    metrics = {
      totalCategories: count,
      rootCategories: rootCount,
      subcategories: count - rootCount,
      activeCategories: activeCount,
    };

    initialData = categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      parent: c.parent ? { id: c.parent.id, name: c.parent.name, slug: c.parent.slug } : null,
      level: c.level,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      iconUrl: c.iconUrl,
      bannerUrl: c.bannerUrl,
      metaTitle: c.metaTitle,
      metaDescription: c.metaDescription,
      createdAt: c.createdAt.toISOString(),
      _count: {
        children: c._count.children,
        productCategories: c._count.productCategories,
        categoryAttributes: c._count.categoryAttributes,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch categories SSR data:", err);
  }

  return (
    <CategoriesClient
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
