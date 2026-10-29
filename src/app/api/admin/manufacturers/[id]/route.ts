import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { manufacturerUpdateSchema } from "@/lib/validations/manufacturer";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: "Manufacturer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: manufacturer,
    });
  } catch (error: any) {
    console.error("[MANUFACTURER_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve manufacturer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = manufacturerUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingManufacturer = await prisma.manufacturer.findUnique({
      where: { id },
    });

    if (!existingManufacturer) {
      return NextResponse.json(
        { success: false, error: "Manufacturer not found" },
        { status: 404 }
      );
    }

    const {
      companyName,
      registrationNo,
      email,
      phone,
      address,
      countryOfOrigin,
      isActive,
    } = validation.data;

    // Check duplicate company name if changed
    if (companyName && companyName !== existingManufacturer.companyName) {
      const duplicate = await prisma.manufacturer.findFirst({
        where: {
          companyName: { equals: companyName, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Manufacturer name "${companyName}" is already registered.` },
          { status: 409 }
        );
      }
    }

    const updatedManufacturer = await prisma.manufacturer.update({
      where: { id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(registrationNo !== undefined && { registrationNo }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(countryOfOrigin !== undefined && { countryOfOrigin: countryOfOrigin || "India" }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Real-time broadcast
    broadcastSocketEvent("manufacturers:changed", {
      action: "updated",
      manufacturerId: id,
      companyName: updatedManufacturer.companyName,
    });

    return NextResponse.json({
      success: true,
      message: `Manufacturer "${updatedManufacturer.companyName}" updated successfully.`,
      data: updatedManufacturer,
    });
  } catch (error: any) {
    console.error("[MANUFACTURER_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update manufacturer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: "Manufacturer not found" },
        { status: 404 }
      );
    }

    if (manufacturer._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${manufacturer.companyName}" because ${manufacturer._count.products} products are produced by this manufacturer. Reassign products first.`,
        },
        { status: 400 }
      );
    }

    await prisma.manufacturer.delete({
      where: { id },
    });

    // Real-time broadcast
    broadcastSocketEvent("manufacturers:changed", {
      action: "deleted",
      manufacturerId: id,
      companyName: manufacturer.companyName,
    });

    return NextResponse.json({
      success: true,
      message: `Manufacturer "${manufacturer.companyName}" was successfully removed.`,
    });
  } catch (error: any) {
    console.error("[MANUFACTURER_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete manufacturer" },
      { status: 500 }
    );
  }
}
