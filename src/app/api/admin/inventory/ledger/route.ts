import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type");
    const warehouseId = searchParams.get("warehouseId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));

    const where: any = {};

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        {
          variant: {
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              {
                product: {
                  title: { contains: search, mode: "insensitive" },
                },
              },
            ],
          },
        },
      ];
    }

    if (type && type !== "all") {
      where.type = type;
    }

    if (warehouseId && warehouseId !== "all") {
      where.OR = [
        { toWarehouseId: warehouseId },
        { fromWarehouseId: warehouseId },
      ];
    }

    const [movements, totalItems] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variant: {
            include: {
              product: {
                select: { title: true, code: true, slug: true },
              },
            },
          },
          fromWarehouse: { select: { id: true, name: true, code: true } },
          toWarehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("[INVENTORY_LEDGER_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve stock ledger" },
      { status: 500 }
    );
  }
}
