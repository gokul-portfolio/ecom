import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";

const departmentCreateSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    // Dynamic search filter
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
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
    const validation = departmentCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code, name, description } = validation.data;

    // Check duplicate code
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Department code "${code}" already exists` },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
        description: description || null,
        isActive: true,
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
