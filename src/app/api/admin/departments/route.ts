import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { departmentSchema } from "@/lib/validations/department";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    // Search filter strictly by department name
    const where = search
      ? {
          name: { contains: search, mode: "insensitive" as const },
        }
      : {};

    const allowedSortColumns = ["name", "code", "createdAt", "isActive"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [validSortBy]: sortOrder },
        include: {
          _count: {
            select: {
              staff: true,
              roles: true,
            },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[DEPARTMENTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = departmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, isActive } = validation.data;
    let code = validation.data.code?.trim().toUpperCase();

    // If code is not provided, auto-generate sequential code: DEP001, DEP002, etc.
    if (!code) {
      const totalCount = await prisma.department.count();
      let nextNum = totalCount + 1;
      let candidate = `DEP${String(nextNum).padStart(3, "0")}`;
      while (await prisma.department.findUnique({ where: { code: candidate } })) {
        nextNum++;
        candidate = `DEP${String(nextNum).padStart(3, "0")}`;
      }
      code = candidate;
    } else {
      // Check duplicate code if explicitly provided
      const existing = await prisma.department.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Department code "${code}" already exists` },
          { status: 409 }
        );
      }
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        _count: {
          select: { staff: true, roles: true },
        },
      },
    });

    // Notify all connected admin clients via WebSocket
    broadcastSocketEvent("departments:changed", { action: "CREATE", id: department.id });

    return NextResponse.json({
      success: true,
      message: "Department created successfully",
      data: department,
    }, { status: 201 });
  } catch (error) {
    console.error("[DEPARTMENTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create department" },
      { status: 500 }
    );
  }
}
