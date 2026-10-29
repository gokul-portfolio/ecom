import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { attributeUpdateSchema } from "@/lib/validations/attribute";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const attribute = await prisma.attributeDefinition.findUnique({
      where: { id },
      include: {
        categoryMappings: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            categoryMappings: true,
            attributeValues: true,
          },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: "Attribute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attribute,
    });
  } catch (error: any) {
    console.error("[ATTRIBUTE_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve attribute" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = attributeUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingAttribute = await prisma.attributeDefinition.findUnique({
      where: { id },
    });

    if (!existingAttribute) {
      return NextResponse.json(
        { success: false, error: "Attribute not found" },
        { status: 404 }
      );
    }

    const {
      name,
      code,
      dataType,
      allowedOptions,
      unitGroup,
      defaultUnit,
      isFilterable,
      isSearchable,
      isVariantAxis,
      isActive,
    } = validation.data;

    // Check code uniqueness if changed
    if (code && code !== existingAttribute.code) {
      const duplicateCode = await prisma.attributeDefinition.findUnique({
        where: { code },
      });
      if (duplicateCode && duplicateCode.id !== id) {
        return NextResponse.json(
          { success: false, error: `Attribute code "${code}" is already in use.` },
          { status: 409 }
        );
      }
    }

    const updatedAttribute = await prisma.attributeDefinition.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(dataType !== undefined && { dataType }),
        ...(allowedOptions !== undefined && { allowedOptions: allowedOptions || [] }),
        ...(unitGroup !== undefined && { unitGroup: unitGroup || null }),
        ...(defaultUnit !== undefined && { defaultUnit: defaultUnit || null }),
        ...(isFilterable !== undefined && { isFilterable }),
        ...(isSearchable !== undefined && { isSearchable }),
        ...(isVariantAxis !== undefined && { isVariantAxis }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: {
            categoryMappings: true,
            attributeValues: true,
          },
        },
      },
    });

    // Real-time broadcast
    broadcastSocketEvent("attributes:changed", {
      action: "updated",
      attributeId: id,
      attributeName: updatedAttribute.name,
    });

    return NextResponse.json({
      success: true,
      message: `Attribute "${updatedAttribute.name}" updated successfully.`,
      data: updatedAttribute,
    });
  } catch (error: any) {
    console.error("[ATTRIBUTE_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update attribute" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const attribute = await prisma.attributeDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attributeValues: true,
            categoryMappings: true,
          },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json(
        { success: false, error: "Attribute not found" },
        { status: 404 }
      );
    }

    if (attribute._count.attributeValues > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete attribute "${attribute.name}" because it is currently assigned values across ${attribute._count.attributeValues} product records.`,
        },
        { status: 400 }
      );
    }

    await prisma.attributeDefinition.delete({
      where: { id },
    });

    // Real-time broadcast
    broadcastSocketEvent("attributes:changed", {
      action: "deleted",
      attributeId: id,
      attributeName: attribute.name,
    });

    return NextResponse.json({
      success: true,
      message: `Attribute "${attribute.name}" was successfully removed.`,
    });
  } catch (error: any) {
    console.error("[ATTRIBUTE_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attribute" },
      { status: 500 }
    );
  }
}
