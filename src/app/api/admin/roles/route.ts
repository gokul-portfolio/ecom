import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { roleSchema } from "@/lib/validations/role";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    const where: Record<string, unknown> = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const allowedSort = ["name", "slug", "createdAt"];
    const validSort = allowedSort.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [validSort]: sortOrder },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              staff: true,
            },
          },
        },
      }),
      prisma.role.count({ where }),
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
    console.error("[ROLES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = roleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, departmentId, description, permissions } = validation.data;
    let slug = validation.data.slug?.trim().toLowerCase();

    // Auto-generate sequential slug if not provided
    if (!slug) {
      const count = await prisma.role.count();
      let nextNum = count + 1;
      let candidate = `role_${String(nextNum).padStart(3, "0")}`;
      while (await prisma.role.findUnique({ where: { slug: candidate } })) {
        nextNum++;
        candidate = `role_${String(nextNum).padStart(3, "0")}`;
      }
      slug = candidate;
    } else {
      // Check slug collision
      const existing = await prisma.role.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Role slug "${slug}" is already taken` },
          { status: 409 }
        );
      }
    }

    // Check department existence
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      return NextResponse.json(
        { success: false, error: "Selected department does not exist" },
        { status: 404 }
      );
    }

    const createdRole = await prisma.role.create({
      data: {
        name,
        slug,
        departmentId,
        description: description || null,
        permissions: permissions || [],
        isSystem: false,
      },
      include: {
        department: true,
        _count: {
          select: { staff: true },
        },
      },
    });

    broadcastSocketEvent("roles:changed", { action: "CREATE", id: createdRole.id });

    return NextResponse.json({
      success: true,
      message: "Role created successfully",
      data: createdRole,
    }, { status: 201 });
  } catch (error) {
    console.error("[ROLES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create role" },
      { status: 500 }
    );
  }
}
