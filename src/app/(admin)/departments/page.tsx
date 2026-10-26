import React from "react";
import { prisma } from "@/lib/prisma";
import { DepartmentsClient, DepartmentRecord } from "./DepartmentsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Department Management | Admin",
  description: "Configure organizational departments, team staffing, and functional boundaries.",
};

export default async function DepartmentsPage() {
  // Server-Side Rendering (SSR) Prefetching directly from PostgreSQL via Prisma
  let initialData: DepartmentRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;

  try {
    const [departments, count] = await Promise.all([
      prisma.department.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              staff: true,
              roles: true,
            },
          },
        },
      }),
      prisma.department.count(),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;

    // Serialize Dates to ISO Strings for Client Component
    initialData = departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      isActive: d.isActive,
      createdAt: d.createdAt.toISOString(),
      _count: {
        staff: d._count.staff,
        roles: d._count.roles,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch departments SSR data:", err);
  }

  return (
    <DepartmentsClient
      initialData={initialData}
      initialPagination={{
        totalItems,
        totalPages,
        currentPage: 1,
        pageSize: 10,
      }}
    />
  );
}
