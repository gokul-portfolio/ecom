import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryBalances: {
          include: {
            variant: {
              include: {
                product: { select: { title: true, code: true } },
              },
            },
          },
          take: 50,
        },
        _count: {
          select: {
            inventoryBalances: true,
            lowStockAlerts: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: "Warehouse not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: warehouse,
    });
  } catch (error: any) {
    console.error("[WAREHOUSE_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve warehouse" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, address, city, state, country, pincode, contactPhone, isActive } = body;

    const existing = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Warehouse not found" },
        { status: 404 }
      );
    }

    if (code && code !== existing.code) {
      const duplicate = await prisma.warehouse.findUnique({
        where: { code },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { success: false, error: `Warehouse code "${code}" is already in use.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(state !== undefined && { state: state?.trim() || null }),
        ...(country !== undefined && { country: country?.trim() || "India" }),
        ...(pincode !== undefined && { pincode: pincode?.trim() || null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    broadcastSocketEvent("warehouses:changed", {
      action: "updated",
      warehouseId: id,
      warehouseName: updated.name,
    });

    return NextResponse.json({
      success: true,
      message: `Warehouse "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (error: any) {
    console.error("[WAREHOUSE_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update warehouse" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryBalances: {
          where: { onHand: { gt: 0 } },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: "Warehouse not found" },
        { status: 404 }
      );
    }

    if (warehouse.inventoryBalances.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete warehouse "${warehouse.name}" because it still holds positive stock balance across ${warehouse.inventoryBalances.length} items. Transfer or liquidate stock first.`,
        },
        { status: 400 }
      );
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    broadcastSocketEvent("warehouses:changed", {
      action: "deleted",
      warehouseId: id,
      warehouseName: warehouse.name,
    });

    return NextResponse.json({
      success: true,
      message: `Warehouse "${warehouse.name}" was successfully removed.`,
    });
  } catch (error: any) {
    console.error("[WAREHOUSE_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}
