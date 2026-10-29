import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { brandSchema } from "@/lib/validations/brand";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { countryOfOrigin: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }

    const allowedSortColumns = ["name", "code", "createdAt", "isActive", "countryOfOrigin"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "name";

    const [items, totalItems, totalCount, activeCount] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [validSortBy]: sortOrder }, { name: "asc" }],
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.brand.count({ where }),
      prisma.brand.count(),
      prisma.brand.count({ where: { isActive: true } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        totalBrands: totalCount,
        activeBrands: activeCount,
        inactiveBrands: totalCount - activeCount,
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
    console.error("[BRANDS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve brands" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = brandSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      name,
      slug,
      description,
      websiteUrl,
      countryOfOrigin,
      isActive,
      logoUrl,
      logoPublicId,
      metaTitle,
      metaDescription,
    } = validation.data;

    // Check slug and name uniqueness
    const existingSlug = await prisma.brand.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    });

    if (existingSlug) {
      if (existingSlug.slug === slug) {
        return NextResponse.json(
          { success: false, error: `Brand slug "${slug}" already exists.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Brand name "${name}" already exists.` },
        { status: 409 }
      );
    }

    // Auto-generate code e.g. "BRD001"
    const totalCount = await prisma.brand.count();
    const nextCode = `BRD${String(totalCount + 1).padStart(3, "0")}`;

    const newBrand = await prisma.brand.create({
      data: {
        code: nextCode,
        name,
        slug,
        description,
        website: websiteUrl || null,
        countryOfOrigin: countryOfOrigin || "India",
        isActive,
        logoUrl: logoUrl || null,
        logoPublicId: logoPublicId || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Real-time broadcast
    broadcastSocketEvent("brands:changed", {
      action: "created",
      brandId: newBrand.id,
      brandName: newBrand.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Brand "${newBrand.name}" registered successfully.`,
        data: newBrand,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[BRANDS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create brand" },
      { status: 500 }
    );
  }
}
