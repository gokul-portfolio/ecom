import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { categoryUpdateSchema } from "@/lib/validations/category";
import { wouldCreateCycle } from "@/lib/utils/category-tree";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            isActive: true,
            level: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        categoryAttributes: {
          include: {
            attributeDefinition: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            children: true,
            productCategories: true,
            categoryAttributes: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error("[CATEGORY_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = categoryUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        level: true,
        parentId: true,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
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
    } = validation.data;

    // Check slug uniqueness if changed
    if (slug && slug !== existingCategory.slug) {
      const duplicateSlug = await prisma.category.findUnique({
        where: { slug },
      });
      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { success: false, error: `Slug "${slug}" is already in use by another category.` },
          { status: 409 }
        );
      }
    }

    // Check parent hierarchy and prevent circular references
    let newLevel = existingCategory.level;
    const targetParentId = parentId === undefined ? existingCategory.parentId : parentId;

    if (targetParentId) {
      if (targetParentId === id) {
        return NextResponse.json(
          { success: false, error: "A category cannot be its own parent." },
          { status: 400 }
        );
      }

      // Check for cycles using cycle detection utility
      const isCycle = await wouldCreateCycle(id, targetParentId, prisma);
      if (isCycle) {
        return NextResponse.json(
          { success: false, error: "Invalid parent selection: Setting this parent would create a circular dependency loop." },
          { status: 400 }
        );
      }

      const parentCategory = await prisma.category.findUnique({
        where: { id: targetParentId },
        select: { level: true },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { success: false, error: "Selected parent category does not exist." },
          { status: 404 }
        );
      }

      newLevel = parentCategory.level + 1;
    } else {
      newLevel = 0;
    }

    // Execute update in transaction (and record SEO redirect if slug changed)
    const updatedCategory = await prisma.$transaction(async (tx) => {
      // 1. If slug changed, create an automatic 301 SeoRedirect
      if (slug && slug !== existingCategory.slug) {
        await tx.seoRedirect.upsert({
          where: { oldSlug: existingCategory.slug },
          update: {
            newSlug: slug,
            statusCode: 301,
            entityType: "CATEGORY",
          },
          create: {
            oldSlug: existingCategory.slug,
            newSlug: slug,
            statusCode: 301,
            entityType: "CATEGORY",
          },
        });
      }

      // 2. Update category record
      const updated = await tx.category.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(parentId !== undefined && { parentId: parentId || null }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
          ...(iconUrl !== undefined && { iconUrl }),
          ...(iconPublicId !== undefined && { iconPublicId }),
          ...(bannerUrl !== undefined && { bannerUrl }),
          ...(bannerPublicId !== undefined && { bannerPublicId }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          level: newLevel,
        },
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

      // 3. If level changed, recursively update children levels
      if (newLevel !== existingCategory.level) {
        const updateChildrenLevels = async (parentIdToUpdate: string, currentLevel: number) => {
          const children = await tx.category.findMany({
            where: { parentId: parentIdToUpdate },
            select: { id: true },
          });

          for (const child of children) {
            await tx.category.update({
              where: { id: child.id },
              data: { level: currentLevel + 1 },
            });
            await updateChildrenLevels(child.id, currentLevel + 1);
          }
        };

        await updateChildrenLevels(id, newLevel);
      }

      return updated;
    });

    // Real-time broadcast
    broadcastSocketEvent("categories:changed", {
      action: "updated",
      categoryId: id,
      categoryName: updatedCategory.name,
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error: any) {
    console.error("[CATEGORY_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            productCategories: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // Safety checks: Cannot delete category if subcategories or products exist
    if (category._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${category.name}" because it contains ${category._count.children} child subcategories. Reassign or delete child categories first.`,
        },
        { status: 400 }
      );
    }

    if (category._count.productCategories > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${category.name}" because ${category._count.productCategories} products are assigned to it. Reassign products before deleting.`,
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    // Real-time broadcast
    broadcastSocketEvent("categories:changed", {
      action: "deleted",
      categoryId: id,
      categoryName: category.name,
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" was successfully removed.`,
    });
  } catch (error: any) {
    console.error("[CATEGORY_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
