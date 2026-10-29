import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { productSchema } from "@/lib/validations/product";
import { generateBarcode } from "@/lib/utils/cartesian";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const productType = searchParams.get("productType");
    const brandId = searchParams.get("brandId");
    const categoryId = searchParams.get("categoryId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        {
          variants: {
            some: {
              OR: [
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (productType && productType !== "all") {
      where.productType = productType;
    }

    if (brandId && brandId !== "all") {
      where.brandId = brandId;
    }

    if (categoryId && categoryId !== "all") {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    const allowedSortColumns = ["title", "code", "basePrice", "createdAt", "status"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems, totalCount, publishedCount, draftCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ [validSortBy]: sortOrder }, { createdAt: "desc" }],
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          manufacturer: {
            select: { id: true, companyName: true },
          },
          taxClass: {
            select: { id: true, name: true, rate: true },
          },
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          media: {
            orderBy: [{ isThumbnail: "desc" }, { sortOrder: "asc" }],
            take: 3,
          },
          variants: {
            select: {
              id: true,
              sku: true,
              barcode: true,
              title: true,
              price: true,
              compareAtPrice: true,
              isDefault: true,
              isActive: true,
              inventoryBalances: {
                select: {
                  onHand: true,
                  reserved: true,
                  available: true,
                  lowStockThreshold: true,
                },
              },
            },
          },
          _count: {
            select: {
              variants: true,
              media: true,
              attributeValues: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.product.count({ where: { status: "DRAFT" } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    // Enhance records with calculated total stock across all variants & warehouses
    const enhancedData = items.map((product) => {
      let totalOnHand = 0;
      let totalAvailable = 0;
      let isLowStock = false;

      product.variants.forEach((v) => {
        v.inventoryBalances.forEach((ib) => {
          totalOnHand += ib.onHand;
          totalAvailable += ib.available;
          if (ib.available <= ib.lowStockThreshold) {
            isLowStock = true;
          }
        });
      });

      return {
        ...product,
        totalOnHand,
        totalAvailable,
        isLowStock,
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedData,
      metrics: {
        totalProducts: totalCount,
        publishedProducts: publishedCount,
        draftProducts: draftCount,
        archivedProducts: totalCount - publishedCount - draftCount,
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
    console.error("[PRODUCTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
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

    // Check slug uniqueness
    const duplicateSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        { success: false, error: `Product slug "${slug}" is already in use.` },
        { status: 409 }
      );
    }

    // Auto-generate next code sequence e.g. "PRD001"
    const totalCount = await prisma.product.count();
    const nextCode = `PRD${String(totalCount + 1).padStart(3, "0")}`;

    // Get default warehouse for initial stock seeding
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // Execute atomic product creation
    const newProduct = await prisma.$transaction(async (tx) => {
      // 1. Create Core Product
      const product = await tx.product.create({
        data: {
          code: nextCode,
          title,
          slug,
          shortDescription: shortDescription || null,
          description: description || null,
          productType,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          basePrice,
          compareAtPrice: compareAtPrice || null,
          costPrice: costPrice || null,
          isTaxInclusive,
          taxClassId: taxClassId || null,
          brandId: brandId || null,
          manufacturerId: manufacturerId || null,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          canonicalUrl: canonicalUrl || null,
        },
      });

      // 2. Associate Categories
      if (categoryIds && categoryIds.length > 0) {
        const primaryCat = primaryCategoryId || categoryIds[0];
        await tx.productCategory.createMany({
          data: categoryIds.map((catId) => ({
            productId: product.id,
            categoryId: catId,
            isPrimary: catId === primaryCat,
          })),
        });
      }

      // 3. Create Media
      if (media && media.length > 0) {
        await tx.productMedia.createMany({
          data: media.map((m, index) => ({
            productId: product.id,
            url: m.url,
            publicId: m.publicId,
            altText: m.altText || title,
            sortOrder: m.sortOrder ?? index,
            isThumbnail: m.isThumbnail || index === 0,
          })),
        });
      }

      // 4. Create Variants
      if (variants && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              barcode: v.barcode || generateBarcode(nextCode, i + 1000),
              title: v.title,
              optionValues: v.optionValues,
              price: v.price ?? basePrice,
              compareAtPrice: v.compareAtPrice ?? compareAtPrice ?? null,
              costPrice: v.costPrice ?? costPrice ?? null,
              weight: v.weight || null,
              weightUnit: v.weightUnit || "kg",
              isDefault: v.isDefault || i === 0,
              isActive: v.isActive ?? true,
            },
          });

          // Seed initial inventory balance if warehouse exists
          if (defaultWarehouse) {
            const stockQty = v.initialStock ?? 0;
            await tx.inventoryBalance.create({
              data: {
                warehouseId: defaultWarehouse.id,
                variantId: variant.id,
                onHand: stockQty,
                reserved: 0,
                available: stockQty,
                lowStockThreshold: 5,
              },
            });

            if (stockQty > 0) {
              await tx.stockMovement.create({
                data: {
                  variantId: variant.id,
                  toWarehouseId: defaultWarehouse.id,
                  type: "PURCHASE_RECEIPT",
                  quantity: stockQty,
                  resultingOnHand: stockQty,
                  reason: "Initial Product Creation Balance",
                  referenceNumber: product.code,
                },
              });
            }
          }
        }
      } else {
        // Fallback: Create Single Default Variant
        const defaultVar = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: `${nextCode}-DEFAULT`,
            barcode: generateBarcode(nextCode, 1000),
            title: "Standard Edition",
            optionValues: {},
            price: basePrice,
            compareAtPrice: compareAtPrice || null,
            costPrice: costPrice || null,
            weight: 0.5,
            weightUnit: "kg",
            isDefault: true,
            isActive: true,
          },
        });

        if (defaultWarehouse) {
          await tx.inventoryBalance.create({
            data: {
              warehouseId: defaultWarehouse.id,
              variantId: defaultVar.id,
              onHand: 10,
              reserved: 0,
              available: 10,
              lowStockThreshold: 5,
            },
          });
        }
      }

      // 5. Create Dynamic EAV Attribute Values
      if (attributeValues && attributeValues.length > 0) {
        await tx.productAttributeValue.createMany({
          data: attributeValues.map((av) => ({
            productId: product.id,
            attributeId: av.attributeId,
            textValue: av.textValue || null,
            numValue: av.numValue || null,
            boolValue: av.boolValue ?? null,
            jsonValue: av.jsonValue || null,
            unit: av.unit || null,
          })),
        });
      }

      return product;
    });

    // Real-time broadcast
    broadcastSocketEvent("products:changed", {
      action: "created",
      productId: newProduct.id,
      productTitle: newProduct.title,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Product "${newProduct.title}" created successfully.`,
        data: newProduct,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[PRODUCTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
