import React from "react";
import { notFound, redirect, RedirectType } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  SeoProductInput,
} from "@/lib/seo/structured-data";
import { ProductDetailClient } from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      title: true,
      metaTitle: true,
      metaDescription: true,
      shortDescription: true,
      media: {
        where: { isThumbnail: true },
        select: { url: true, altText: true },
        take: 1,
      },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found | Store",
    };
  }

  const title = product.metaTitle || `${product.title} | Enterprise Store`;
  const description =
    product.metaDescription || product.shortDescription || `Buy ${product.title} online with fast nationwide delivery.`;
  const imageUrl = product.media?.[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: product.media[0]?.altText || title }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `/products/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { variant: variantSku } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: {
        select: { id: true, name: true, logoUrl: true, website: true },
      },
      manufacturer: {
        select: { id: true, companyName: true, countryOfOrigin: true },
      },
      categories: {
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      media: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        include: {
          inventoryBalances: {
            select: {
              available: true,
              onHand: true,
              warehouse: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
        orderBy: { price: "asc" },
      },
      attributeValues: {
        include: {
          attributeDefinition: {
            select: { id: true, code: true, name: true, dataType: true, defaultUnit: true },
          },
        },
      },
    },
  });

  // Automated 301 Permanent Redirect Handler
  if (!product) {
    const redirectRecord = await prisma.seoRedirect.findUnique({
      where: { oldSlug: slug },
    });

    if (redirectRecord && redirectRecord.entityType === "PRODUCT") {
      redirect(`/products/${redirectRecord.newSlug}`, RedirectType.replace);
    }

    notFound();
  }

  // Build Breadcrumbs
  const primaryCategory = product.categories.find((c) => c.isPrimary)?.category || product.categories[0]?.category;
  const breadcrumbs = [
    { name: "Home", slug: "" },
    ...(primaryCategory ? [{ name: primaryCategory.name, slug: primaryCategory.slug }] : []),
    { name: product.title, slug: product.slug },
  ];

  // Generate Schemas for SEO
  const seoInput: SeoProductInput = {
    id: product.id,
    code: product.code,
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice: Number(product.basePrice),
    brand: product.brand,
    manufacturer: product.manufacturer ? { name: product.manufacturer.companyName } : null,
    categories: product.categories.map((c) => ({
      isPrimary: c.isPrimary,
      category: { name: c.category.name, slug: c.category.slug },
    })),
    media: product.media.map((m) => ({
      url: m.url,
      altText: m.altText,
      isThumbnail: m.isThumbnail,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      title: v.title,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      inventoryBalances: v.inventoryBalances.map((b) => ({ available: b.available })),
    })),
  };

  const productJsonLd = generateProductJsonLd(seoInput, variantSku);
  const breadcrumbsJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  // Serialize Product for Client Component
  const serializedProduct = {
    id: product.id,
    code: product.code,
    title: product.title,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    basePrice: Number(product.basePrice),
    brand: product.brand,
    manufacturer: product.manufacturer
      ? {
          id: product.manufacturer.id,
          name: product.manufacturer.companyName,
          countryOfOrigin: product.manufacturer.countryOfOrigin,
        }
      : null,
    categories: product.categories.map((c) => ({
      isPrimary: c.isPrimary,
      category: c.category,
    })),
    media: product.media.map((m) => ({
      id: m.id,
      url: m.url,
      altText: m.altText,
      isThumbnail: m.isThumbnail,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      title: v.title,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      optionValues: (v.optionValues as Record<string, string>) || {},
      inventoryBalances: v.inventoryBalances.map((b) => ({
        available: b.available,
        onHand: b.onHand,
        warehouse: b.warehouse,
      })),
    })),
    attributes: product.attributeValues.map((av) => ({
      name: av.attributeDefinition.name,
      dataType: av.attributeDefinition.dataType,
      value: av.textValue || av.numValue?.toString() || (av.boolValue ? "Yes" : "No") || "—",
      unit: av.unit || av.attributeDefinition.defaultUnit || "",
    })),
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <ProductDetailClient
        product={serializedProduct}
        initialVariantSku={variantSku}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
