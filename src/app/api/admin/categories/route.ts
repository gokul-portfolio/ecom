import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { categorySchema } from "@/lib/validations/category";
import { buildCategoryTree } from "@/lib/utils/category-tree";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view"); // "tree" | "flat"
    const search = searchParams.get("search")?.trim() || "";
    const parentId = searchParams.get("parentId");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "sortOrder";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc";

    // 1. If tree view requested (e.g. for tree selector or hierarchical visual view)
    if (view === "tree") {
      const allCategories = await prisma.category.findMany({
        where: status && status !== "all" ? { isActive: status === "ACTIVE" } : {},
        orderBy: [{ level: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              children: true,
              productCategories: true,
              categoryAttributes: true,
            },
          },
        },
      });

      const tree = buildCategoryTree(allCategories);
      const rootCount = allCategories.filter((c) => !c.parentId).length;
      const activeCount = allCategories.filter((c) => c.isActive).length;

      return NextResponse.json({
        success: true,
        data: tree,
        metrics: {
          totalCategories: allCategories.length,
          rootCategories: rootCount,
          subcategories: allCategories.length - rootCount,
          activeCategories: activeCount,
        },
      });
    }

    // 2. Standard Paginated Flat List
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (parentId !== undefined && parentId !== null && parentId !== "" && parentId !== "all") {
      where.parentId = parentId === "root" ? null : parentId;
    }

    if (status && status !== "all") {
      where.isActive = status === "ACTIVE";
    }

    const allowedSortColumns = ["name", "code", "sortOrder", "level", "createdAt", "isActive"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "sortOrder";

    const [items, totalItems, totalCount, rootCount, activeCount] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [validSortBy]: sortOrder }, { name: "asc" }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              children: true,
              productCategories: true,
              categoryAttributes: true,
            },
          },
        },
      }),
      prisma.category.count({ where }),
      prisma.category.count(),
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.count({ where: { isActive: true } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        totalCategories: totalCount,
        rootCategories: rootCount,
        subcategories: totalCount - rootCount,
        activeCategories: activeCount,
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
    console.error("[CATEGORIES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

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
      parentId,
      sortOrder,
      isActive,
      iconUrl,
      iconPublicId,
      bannerUrl,
      bannerPublicId,
      metaTitle,
      metaDescription,
      canonicalUrl,
    } = validation.data;

    // 1. Slug uniqueness check
    const existingSlug = await prisma.category.findUnique({ where: { slug } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `URL Slug "${slug}" is already in use by another category` },
        { status: 409 }
      );
    }

    // 2. Code resolution (auto-generate CAT001, CAT002 if omitted)
    let code = validation.data.code?.trim().toUpperCase();
    if (!code) {
      const count = await prisma.category.count();
      let nextNum = count + 1;
      let candidate = `CAT${String(nextNum).padStart(3, "0")}`;
      while (await prisma.category.findUnique({ where: { code: candidate } })) {
        nextNum++;
        candidate = `CAT${String(nextNum).padStart(3, "0")}`;
      }
      code = candidate;
    } else {
      const existingCode = await prisma.category.findUnique({ where: { code } });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: `Category code "${code}" already exists` },
          { status: 409 }
        );
      }
    }

    // 3. Hierarchy Level calculation
    let level = 0;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Selected parent category does not exist" },
          { status: 400 }
        );
      }
      level = parent.level + 1;
    }

    // 4. Create Category
    const category = await prisma.category.create({
      data: {
        code,
        name,
        slug,
        description,
        parentId,
        level,
        sortOrder,
        isActive,
        iconUrl,
        iconPublicId,
        bannerUrl,
        bannerPublicId,
        metaTitle,
        metaDescription,
        canonicalUrl,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { children: true, productCategories: true },
        },
      },
    });

    // Notify connected admin clients via WebSocket
    broadcastSocketEvent("categories:changed", { action: "CREATE", id: category.id });

    return NextResponse.json(
      {
        success: true,
        message: `Category "${name}" created successfully`,
        data: category,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[CATEGORIES_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}
