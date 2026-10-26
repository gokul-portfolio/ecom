import React from "react";
import { prisma } from "@/lib/prisma";
import { ShiftsClient, ShiftRecord } from "./ShiftsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shift Management | Admin",
  description: "Configure operational staff working shifts, schedules, timings, and grace periods.",
};

export default async function ShiftsPage() {
  // Server-Side Rendering (SSR) Prefetching directly from PostgreSQL via Prisma
  let initialData: ShiftRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;

  try {
    const [shifts, count] = await Promise.all([
      prisma.shift.findMany({
        orderBy: { name: "asc" },
        take: 10,
        include: {
          _count: {
            select: {
              staff: true,
            },
          },
        },
      }),
      prisma.shift.count(),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;

    // Serialize Dates to ISO Strings for Client Component
    initialData = shifts.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      gracePeriodMins: s.gracePeriodMins,
      description: s.description,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      _count: {
        staff: s._count.staff,
      },
    }));
  } catch (err) {
    console.error("Failed to prefetch shifts SSR data:", err);
  }

  return (
    <ShiftsClient
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
