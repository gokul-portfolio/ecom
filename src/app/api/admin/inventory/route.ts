import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/lib/services/inventory.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const warehouseId = searchParams.get("warehouseId");
    const isLowStock = searchParams.get("isLowStock");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        {
          variant: {
            OR: [
              { sku: { contains: search, mode: "insensitive" } },
              { barcode: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              {
                product: {
                  title: { contains: search, mode: "insensitive" },
                },
              },
            ],
          },
        },
        {
          warehouse: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (warehouseId && warehouseId !== "all") {
      where.warehouseId = warehouseId;
    }

    const [balances, totalItems, totalCount, alertCount] = await Promise.all([
      prisma.inventoryBalance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [sortBy]: sortOrder }],
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, city: true },
          },
          variant: {
            include: {
              product: {
                select: { id: true, title: true, code: true, slug: true, basePrice: true },
              },
            },
          },
        },
      }),
      prisma.inventoryBalance.count({ where }),
      prisma.inventoryBalance.count(),
      prisma.lowStockAlert.count({ where: { isAcknowledged: false } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    // Filter low stock if requested in memory or query
    const filteredBalances =
      isLowStock === "true"
        ? balances.filter((b) => b.available <= b.lowStockThreshold)
        : balances;

    return NextResponse.json({
      success: true,
      data: filteredBalances,
      metrics: {
        totalTrackedSkus: totalCount,
        unacknowledgedAlerts: alertCount,
      },
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
    console.error("[INVENTORY_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve inventory balances" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, warehouseId, type, quantity, reason, referenceNumber } = body;

    if (!variantId || !warehouseId || !type || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "variantId, warehouseId, type, and quantity are required." },
        { status: 400 }
      );
    }

    const updatedBalance = await adjustStock({
      variantId,
      warehouseId,
      type,
      quantity: Number(quantity),
      reason,
      referenceNumber,
    });

    return NextResponse.json({
      success: true,
      message: "Stock adjustment processed and ledger row recorded.",
      data: updatedBalance,
    });
  } catch (error: any) {
    console.error("[INVENTORY_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process stock adjustment" },
      { status: 500 }
    );
  }
}
