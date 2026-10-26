import React, { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PermissionsClient, RoleOption } from "./PermissionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Role Permissions Matrix | Admin",
  description: "Configure granular operational permissions, data isolation, and administrative governance policies per role.",
};

export default async function PermissionsPage() {
  let roles: RoleOption[] = [];

  try {
    const fetchedRoles = await prisma.role.findMany({
      orderBy: { name: "asc" },
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
    });

    roles = fetchedRoles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissions: Array.isArray(r.permissions) ? (r.permissions as string[]) : [],
      department: r.department
        ? {
            id: r.department.id,
            name: r.department.name,
            code: r.department.code,
          }
        : undefined,
      _count: {
        staff: r._count.staff,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch roles for permissions matrix:", err);
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading permissions matrix...
        </div>
      }
    >
      <PermissionsClient initialRoles={roles} />
    </Suspense>
  );
}
