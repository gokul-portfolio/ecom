import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { productUpdateSchema } from "@/lib/validations/product";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        manufacturer: true,
        taxClass: true,
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, code: true, level: true },
            },
          },
        },
        media: {
          orderBy: [{ isThumbnail: "desc" }, { sortOrder: "asc" }],
        },
        variants: {
          include: {
            inventoryBalances: {
              include: {
                warehouse: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
          orderBy: [{ isDefault: "desc" }, { price: "asc" }],
        },
        attributeValues: {
          include: {
            attributeDefinition: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error("[PRODUCT_GET_BY_ID_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validation = productUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const {
      title,
      slug,
      shortDescription,
      description,
      productType,
      status,
      basePrice,
      compareAtPrice,
      costPrice,
      isTaxInclusive,
      taxClassId,
      brandId,
      manufacturerId,
      metaTitle,
      metaDescription,
      canonicalUrl,
      categoryIds,
      primaryCategoryId,
      media,
      variants,
      attributeValues,
    } = validation.data;

    // Check slug uniqueness if changed
    if (slug && slug !== existingProduct.slug) {
      const duplicateSlug = await prisma.product.findUnique({
        where: { slug },
      });
      if (duplicateSlug && duplicateSlug.id !== id) {
        return NextResponse.json(
          { success: false, error: `Product slug "${slug}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Atomic update
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. If slug changed, create 301 SeoRedirect
      if (slug && slug !== existingProduct.slug) {
        await tx.seoRedirect.upsert({
          where: { oldSlug: existingProduct.slug },
          update: {
            newSlug: slug,
            statusCode: 301,
            entityType: "PRODUCT",
          },
          create: {
            oldSlug: existingProduct.slug,
            newSlug: slug,
            statusCode: 301,
            entityType: "PRODUCT",
          },
        });
      }

      // 2. Update core product fields
      const product = await tx.product.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(shortDescription !== undefined && { shortDescription }),
          ...(description !== undefined && { description }),
          ...(productType !== undefined && { productType }),
          ...(status !== undefined && {
            status,
            publishedAt:
              status === "PUBLISHED" && !existingProduct.publishedAt
                ? new Date()
                : existingProduct.publishedAt,
          }),
          ...(basePrice !== undefined && { basePrice }),
          ...(compareAtPrice !== undefined && { compareAtPrice }),
          ...(costPrice !== undefined && { costPrice }),
          ...(isTaxInclusive !== undefined && { isTaxInclusive }),
          ...(taxClassId !== undefined && { taxClassId: taxClassId || null }),
          ...(brandId !== undefined && { brandId: brandId || null }),
          ...(manufacturerId !== undefined && { manufacturerId: manufacturerId || null }),
          ...(metaTitle !== undefined && { metaTitle }),
          ...(metaDescription !== undefined && { metaDescription }),
          ...(canonicalUrl !== undefined && { canonicalUrl }),
        },
      });

      // 3. Sync Categories if provided
      if (categoryIds !== undefined) {
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });

        if (categoryIds.length > 0) {
          const primaryCat = primaryCategoryId || categoryIds[0];
          await tx.productCategory.createMany({
            data: categoryIds.map((catId) => ({
              productId: id,
              categoryId: catId,
              isPrimary: catId === primaryCat,
            })),
          });
        }
      }

      // 4. Sync Media if provided
      if (media !== undefined) {
        await tx.productMedia.deleteMany({
          where: { productId: id },
        });

        if (media.length > 0) {
          await tx.productMedia.createMany({
            data: media.map((m, index) => ({
              productId: id,
              url: m.url,
              publicId: m.publicId,
              altText: m.altText || product.title,
              sortOrder: m.sortOrder ?? index,
              isThumbnail: m.isThumbnail || index === 0,
            })),
          });
        }
      }

      // 5. Sync Attribute Values if provided
      if (attributeValues !== undefined) {
        await tx.productAttributeValue.deleteMany({
          where: { productId: id },
        });

        if (attributeValues.length > 0) {
          await tx.productAttributeValue.createMany({
            data: attributeValues.map((av) => ({
              productId: id,
              attributeId: av.attributeId,
              textValue: av.textValue || null,
              numValue: av.numValue || null,
              boolValue: av.boolValue ?? null,
              jsonValue: av.jsonValue || null,
              unit: av.unit || null,
            })),
          });
        }
      }

      return product;
    });

    // Real-time broadcast
    broadcastSocketEvent("products:changed", {
      action: "updated",
      productId: id,
      productTitle: updatedProduct.title,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${updatedProduct.title}" updated successfully.`,
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error("[PRODUCT_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    // Real-time broadcast
    broadcastSocketEvent("products:changed", {
      action: "deleted",
      productId: id,
      productTitle: product.title,
    });

    return NextResponse.json({
      success: true,
      message: `Product "${product.title}" was successfully deleted.`,
    });
  } catch (error: any) {
    console.error("[PRODUCT_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
