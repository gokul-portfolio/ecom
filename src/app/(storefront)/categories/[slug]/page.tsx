import React from "react";
import Link from "next/link";
import { notFound, redirect, RedirectType } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  generateBreadcrumbJsonLd,
  generateCategoryJsonLd,
} from "@/lib/seo/structured-data";
import {
  Layers,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Tag,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      name: true,
      metaTitle: true,
      metaDescription: true,
      description: true,
    },
  });

  if (!category) {
    return {
      title: "Category Not Found | Store",
    };
  }

  const title = category.metaTitle || `${category.name} Catalog | Enterprise Store`;
  const description =
    category.metaDescription || category.description || `Browse the latest collection in ${category.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, iconUrl: true },
        orderBy: { sortOrder: "asc" },
      },
      productCategories: {
        where: {
          product: {
            status: "PUBLISHED",
          },
        },
        include: {
          product: {
            include: {
              brand: {
                select: { name: true },
              },
              media: {
                where: { isThumbnail: true },
                take: 1,
              },
              variants: {
                where: { isActive: true },
                select: { price: true, compareAtPrice: true, sku: true },
                orderBy: { price: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  // Automated 301 Permanent Redirect Handler
  if (!category) {
    const redirectRecord = await prisma.seoRedirect.findUnique({
      where: { oldSlug: slug },
    });

    if (redirectRecord && redirectRecord.entityType === "CATEGORY") {
      redirect(`/categories/${redirectRecord.newSlug}`, RedirectType.replace);
    }

    notFound();
  }

  // Breadcrumbs
  const breadcrumbs = [
    { name: "Home", slug: "" },
    ...(category.parent ? [{ name: category.parent.name, slug: category.parent.slug }] : []),
    { name: category.name, slug: category.slug },
  ];

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const categoryJsonLd = generateCategoryJsonLd(
    category.name,
    category.slug,
    category.productCategories.length
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground">{b.name}</span>
              ) : (
                <Link
                  href={b.slug ? `/categories/${b.slug}` : "/"}
                  className="hover:text-primary transition-colors"
                >
                  {b.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Category Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-gradient-to-r from-primary/10 via-card to-background p-8 sm:p-10 shadow-sm">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Tag className="w-3.5 h-3.5" />
              Category Collection
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Child Subcategories Pills */}
        {category.children.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Subcategories
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:border-primary/60 hover:text-primary text-xs font-medium text-foreground transition-all shadow-sm"
                >
                  <span>{child.name}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Products in this Category ({category.productCategories.length})
            </h2>
          </div>

          {category.productCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {category.productCategories.map(({ product: p }) => {
                const thumb = p.media[0]?.url;
                const minVariant = p.variants[0];
                const price = minVariant?.price ?? Number(p.basePrice);
                const comparePrice = minVariant?.compareAtPrice ? Number(minVariant.compareAtPrice) : null;
                const discount = comparePrice && comparePrice > price
                  ? Math.round(((comparePrice - price) / comparePrice) * 100)
                  : null;

                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-square w-full bg-muted/30 overflow-hidden flex items-center justify-center">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={p.title}
                          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-muted-foreground/40" />
                      )}

                      {discount && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {p.brand && (
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1">
                            {p.brand.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {p.title}
                        </h3>
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-border/50">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            ₹{price.toLocaleString("en-IN")}
                          </span>
                          {comparePrice && comparePrice > price && (
                            <span className="text-xs text-muted-foreground line-through tabular-nums">
                              ₹{comparePrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                          View Details <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/40 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No published products in this category yet</p>
              <p className="text-xs text-muted-foreground">
                Products created in the Product Builder assigned to {category.name} will automatically appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
