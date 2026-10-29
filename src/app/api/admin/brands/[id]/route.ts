import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { brandUpdateSchema } from "@/lib/validations/brand";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error: any) {
    console.error("[BRAND_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve brand" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = brandUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
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

    // Check slug uniqueness if changed
    if (slug && slug !== existingBrand.slug) {
      const duplicateSlug = await prisma.brand.findUnique({
        where: { slug },
      });
      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { success: false, error: `Brand slug "${slug}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Check name uniqueness if changed
    if (name && name !== existingBrand.name) {
      const duplicateName = await prisma.brand.findUnique({
        where: { name },
      });
      if (duplicateName && duplicateName.id !== id) {
        return NextResponse.json(
          { success: false, error: `Brand name "${name}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Execute update in transaction (and record SEO 301 redirect if slug changed)
    const updatedBrand = await prisma.$transaction(async (tx) => {
      if (slug && slug !== existingBrand.slug) {
        await tx.seoRedirect.upsert({
          where: { oldSlug: existingBrand.slug },
          update: {
            newSlug: slug,
            statusCode: 301,
            entityType: "BRAND",
          },
          create: {
            oldSlug: existingBrand.slug,
            newSlug: slug,
            statusCode: 301,
            entityType: "BRAND",
          },
        });
      }

      return tx.brand.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(websiteUrl !== undefined && { website: websiteUrl || null }),
          ...(countryOfOrigin !== undefined && { countryOfOrigin: countryOfOrigin || "India" }),
          ...(isActive !== undefined && { isActive }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(logoPublicId !== undefined && { logoPublicId }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    });

    // Real-time broadcast
    broadcastSocketEvent("brands:changed", {
      action: "updated",
      brandId: id,
      brandName: updatedBrand.name,
    });

    return NextResponse.json({
      success: true,
      message: `Brand "${updatedBrand.name}" updated successfully.`,
      data: updatedBrand,
    });
  } catch (error: any) {
    console.error("[BRAND_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update brand" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    if (brand._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete "${brand.name}" because ${brand._count.products} products are associated with this brand. Reassign or archive the products first.`,
        },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id },
    });

    // Real-time broadcast
    broadcastSocketEvent("brands:changed", {
      action: "deleted",
      brandId: id,
      brandName: brand.name,
    });

    return NextResponse.json({
      success: true,
      message: `Brand "${brand.name}" was successfully removed.`,
    });
  } catch (error: any) {
    console.error("[BRAND_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete brand" },
      { status: 500 }
    );
  }
}
