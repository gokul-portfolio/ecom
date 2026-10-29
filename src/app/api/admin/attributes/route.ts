import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { attributeSchema } from "@/lib/validations/attribute";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const dataType = searchParams.get("dataType");
    const isVariantAxis = searchParams.get("isVariantAxis");
    const isFilterable = searchParams.get("isFilterable");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { defaultUnit: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dataType && dataType !== "all") {
      where.dataType = dataType;
    }

    if (isVariantAxis && isVariantAxis !== "all") {
      where.isVariantAxis = isVariantAxis === "true";
    }

    if (isFilterable && isFilterable !== "all") {
      where.isFilterable = isFilterable === "true";
    }

    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }

    const allowedSortColumns = ["name", "code", "dataType", "createdAt", "isActive"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "name";

    const [items, totalItems, totalCount, variantAxisCount, filterableCount] = await Promise.all([
      prisma.attributeDefinition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [validSortBy]: sortOrder }, { name: "asc" }],
        include: {
          _count: {
            select: {
              categoryMappings: true,
              attributeValues: true,
            },
          },
        },
      }),
      prisma.attributeDefinition.count({ where }),
      prisma.attributeDefinition.count(),
      prisma.attributeDefinition.count({ where: { isVariantAxis: true } }),
      prisma.attributeDefinition.count({ where: { isFilterable: true } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        totalAttributes: totalCount,
        variantAxes: variantAxisCount,
        filterableAttributes: filterableCount,
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
    console.error("[ATTRIBUTES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve attributes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = attributeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
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

    // Check code uniqueness
    const existingCode = await prisma.attributeDefinition.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { success: false, error: `Attribute with code "${code}" already exists.` },
        { status: 409 }
      );
    }

    const newAttribute = await prisma.attributeDefinition.create({
      data: {
        code,
        name,
        dataType,
        allowedOptions: allowedOptions || [],
        unitGroup: unitGroup || null,
        defaultUnit: defaultUnit || null,
        isFilterable,
        isSearchable,
        isVariantAxis,
        isActive,
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
      action: "created",
      attributeId: newAttribute.id,
      attributeName: newAttribute.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Attribute "${newAttribute.name}" created successfully.`,
        data: newAttribute,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[ATTRIBUTES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create attribute" },
      { status: 500 }
    );
  }
}
