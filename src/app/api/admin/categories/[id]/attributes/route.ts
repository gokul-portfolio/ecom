import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: categoryId } = await params;

    const mappings = await prisma.categoryAttribute.findMany({
      where: { categoryId },
      include: {
        attributeDefinition: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: mappings,
    });
  } catch (error: any) {
    console.error("[CATEGORY_ATTRIBUTES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve category attributes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: categoryId } = await params;
    const body = await request.json();

    const { attributeId, isRequired, displayGroup, sortOrder } = body;

    if (!attributeId) {
      return NextResponse.json(
        { success: false, error: "Attribute ID is required" },
        { status: 400 }
      );
    }

    const mapping = await prisma.categoryAttribute.upsert({
      where: {
        categoryId_attributeId: {
          categoryId,
          attributeId,
        },
      },
      update: {
        isRequired: isRequired ?? false,
        displayGroup: displayGroup || "General Specifications",
        sortOrder: Number(sortOrder) || 0,
      },
      create: {
        categoryId,
        attributeId,
        isRequired: isRequired ?? false,
        displayGroup: displayGroup || "General Specifications",
        sortOrder: Number(sortOrder) || 0,
      },
      include: {
        attributeDefinition: true,
      },
    });

    broadcastSocketEvent("categories:changed", {
      action: "attributes_updated",
      categoryId,
    });

    return NextResponse.json({
      success: true,
      message: "Category attribute mapping saved.",
      data: mapping,
    });
  } catch (error: any) {
    console.error("[CATEGORY_ATTRIBUTES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to map category attribute" },
      { status: 500 }
    );
  }
}
