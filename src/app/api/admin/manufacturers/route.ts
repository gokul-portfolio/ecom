import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { manufacturerSchema } from "@/lib/validations/manufacturer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "companyName";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { registrationNo: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { countryOfOrigin: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }

    const allowedSortColumns = ["companyName", "code", "createdAt", "isActive", "countryOfOrigin"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "companyName";

    const [items, totalItems, totalCount, activeCount] = await Promise.all([
      prisma.manufacturer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [validSortBy]: sortOrder }, { companyName: "asc" }],
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.manufacturer.count({ where }),
      prisma.manufacturer.count(),
      prisma.manufacturer.count({ where: { isActive: true } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        totalManufacturers: totalCount,
        activeManufacturers: activeCount,
        inactiveManufacturers: totalCount - activeCount,
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
    console.error("[MANUFACTURERS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve manufacturers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = manufacturerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
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

    // Check duplicate company name
    const existingName = await prisma.manufacturer.findFirst({
      where: { companyName: { equals: companyName, mode: "insensitive" } },
    });

    if (existingName) {
      return NextResponse.json(
        { success: false, error: `Manufacturer "${companyName}" is already registered.` },
        { status: 409 }
      );
    }

    // Auto-generate code e.g. "MNF001"
    const totalCount = await prisma.manufacturer.count();
    const nextCode = `MNF${String(totalCount + 1).padStart(3, "0")}`;

    const newManufacturer = await prisma.manufacturer.create({
      data: {
        code: nextCode,
        companyName,
        registrationNo: registrationNo || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        countryOfOrigin: countryOfOrigin || "India",
        isActive,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Real-time broadcast
    broadcastSocketEvent("manufacturers:changed", {
      action: "created",
      manufacturerId: newManufacturer.id,
      companyName: newManufacturer.companyName,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Manufacturer "${newManufacturer.companyName}" registered successfully.`,
        data: newManufacturer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[MANUFACTURERS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create manufacturer" },
      { status: 500 }
    );
  }
}
