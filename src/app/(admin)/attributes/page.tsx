import React from "react";
import { prisma } from "@/lib/prisma";
import { AttributesClient, AttributeRecord } from "./AttributesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Attribute Engine | Admin Catalog",
  description: "Configure dynamic EAV specifications, variant matrix axes, measurement units, and faceted search filters.",
};

export default async function AttributesPage() {
  let initialData: AttributeRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalAttributes: 0,
    variantAxes: 0,
    filterableAttributes: 0,
  };

  try {
    const [attributes, count, variantAxisCount, filterableCount] = await Promise.all([
      prisma.attributeDefinition.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              categoryMappings: true,
              attributeValues: true,
            },
          },
        },
      }),
      prisma.attributeDefinition.count(),
      prisma.attributeDefinition.count({ where: { isVariantAxis: true } }),
      prisma.attributeDefinition.count({ where: { isFilterable: true } }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;
    metrics = {
      totalAttributes: count,
      variantAxes: variantAxisCount,
      filterableAttributes: filterableCount,
    };

    initialData = attributes.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      dataType: a.dataType,
      allowedOptions: (a.allowedOptions as string[]) || [],
      unitGroup: a.unitGroup,
      defaultUnit: a.defaultUnit,
      isFilterable: a.isFilterable,
      isSearchable: a.isSearchable,
      isVariantAxis: a.isVariantAxis,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      _count: {
        categoryMappings: a._count.categoryMappings,
        attributeValues: a._count.attributeValues,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch attributes SSR data:", err);
  }

  return (
    <AttributesClient
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
