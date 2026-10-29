import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }

    const [warehouses, totalCount, activeCount] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              inventoryBalances: true,
              lowStockAlerts: true,
            },
          },
        },
      }),
      prisma.warehouse.count(),
      prisma.warehouse.count({ where: { isActive: true } }),
    ]);

    // Auto-seed a central default warehouse if none exist
    if (warehouses.length === 0 && !search) {
      const defaultWh = await prisma.warehouse.create({
        data: {
          code: "WH-BLR-01",
          name: "Bengaluru Central Fulfillment Center",
          address: "Plot 42, Electronic City Phase 1",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
          pincode: "560100",
          contactPhone: "+91 80 2345 6789",
          isActive: true,
        },
        include: {
          _count: {
            select: {
              inventoryBalances: true,
              lowStockAlerts: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: [defaultWh],
        metrics: {
          totalWarehouses: 1,
          activeWarehouses: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: warehouses,
      metrics: {
        totalWarehouses: totalCount,
        activeWarehouses: activeCount,
        inactiveWarehouses: totalCount - activeCount,
      },
    });
  } catch (error: any) {
    console.error("[WAREHOUSES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve warehouses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, address, city, state, country, pincode, contactPhone, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Warehouse name is required" },
        { status: 400 }
      );
    }

    const totalCount = await prisma.warehouse.count();
    const finalCode = code?.trim() || `WH${String(totalCount + 1).padStart(3, "0")}`;

    const existingCode = await prisma.warehouse.findUnique({
      where: { code: finalCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Warehouse code "${finalCode}" already exists.` },
        { status: 409 }
      );
    }

    const newWarehouse = await prisma.warehouse.create({
      data: {
        code: finalCode,
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || "India",
        pincode: pincode?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        isActive: isActive ?? true,
      },
    });

    broadcastSocketEvent("warehouses:changed", {
      action: "created",
      warehouseId: newWarehouse.id,
      warehouseName: newWarehouse.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Warehouse "${newWarehouse.name}" created successfully.`,
        data: newWarehouse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[WAREHOUSES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
