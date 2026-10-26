import React from "react";
import { prisma } from "@/lib/prisma";
import { RolesClient, RoleRecord } from "./RolesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roles & Access Control | Admin",
  description: "Define staff governance roles, department allocations, and granular permission matrices.",
};

export default async function RolesPage() {
  // Server-Side Rendering (SSR) Prefetching directly from PostgreSQL via Prisma
  let initialData: RoleRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;

  try {
    const [roles, count] = await Promise.all([
      prisma.role.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              staff: true,
            },
          },
        },
      }),
      prisma.role.count(),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;

    // Serialize Dates and Permissions for Client Component
    initialData = roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      departmentId: r.departmentId,
      permissions: Array.isArray(r.permissions) ? (r.permissions as string[]) : [],
      createdAt: r.createdAt.toISOString(),
      department: {
        id: r.department.id,
        name: r.department.name,
        code: r.department.code,
      },
      _count: {
        staff: r._count.staff,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch roles SSR data:", err);
  }

  return (
    <RolesClient
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
