/**
 * Structured Data & Schema.org JSON-LD Generators for Search Engine Optimization
 * Conforms to Google Search Central, Google Merchant Center, and Schema.org standards.
 */

export interface SeoProductInput {
  id: string;
  code: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  basePrice: number;
  brand?: {
    name: string;
    website?: string | null;
  } | null;
  manufacturer?: {
    name: string;
  } | null;
  categories?: Array<{
    isPrimary: boolean;
    category: {
      name: string;
      slug: string;
    };
  }>;
  media?: Array<{
    url: string;
    altText?: string | null;
    isThumbnail: boolean;
  }>;
  variants?: Array<{
    id: string;
    sku: string;
    barcode?: string | null;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    inventoryBalances?: Array<{
      available: number;
    }>;
  }>;
}

export interface SeoBreadcrumbItem {
  name: string;
  slug: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://store.enterprise.com";

/**
 * Generates Schema.org Product and Offer JSON-LD schema
 */
export function generateProductJsonLd(product: SeoProductInput, selectedVariantSku?: string) {
  const activeVariant =
    product.variants?.find((v) => v.sku === selectedVariantSku) ||
    product.variants?.[0];

  const primaryCategory = product.categories?.find((c) => c.isPrimary)?.category;
  const images = product.media?.map((m) => m.url) || [];

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription || product.title,
    image: images.length > 0 ? images : undefined,
    sku: activeVariant?.sku || product.code,
    mpn: product.code,
    url: `${SITE_URL}/products/${product.slug}`,
  };

  if (activeVariant?.barcode) {
    jsonLd.gtin13 = activeVariant.barcode;
  }

  if (product.brand) {
    jsonLd.brand = {
      "@type": "Brand",
      name: product.brand.name,
    };
  }

  if (product.manufacturer) {
    jsonLd.manufacturer = {
      "@type": "Organization",
      name: product.manufacturer.name,
    };
  }

  if (primaryCategory) {
    jsonLd.category = primaryCategory.name;
  }

  // Offers Schema
  if (product.variants && product.variants.length > 0) {
    if (product.variants.length === 1 || activeVariant) {
      const variantToOffer = activeVariant || product.variants[0];
      const availableUnits =
        variantToOffer.inventoryBalances?.reduce((sum, b) => sum + (b.available || 0), 0) ?? 0;
      const isInStock = availableUnits > 0;

      jsonLd.offers = {
        "@type": "Offer",
        url: `${SITE_URL}/products/${product.slug}?variant=${variantToOffer.sku}`,
        priceCurrency: "INR",
        price: variantToOffer.price,
        itemCondition: "https://schema.org/NewCondition",
        availability: isInStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Universal Storefront",
        },
      };
    } else {
      // AggregateOffer for multi-variant products
      const prices = product.variants.map((v) => v.price);
      const lowPrice = Math.min(...prices);
      const highPrice = Math.max(...prices);

      jsonLd.offers = {
        "@type": "AggregateOffer",
        url: `${SITE_URL}/products/${product.slug}`,
        priceCurrency: "INR",
        lowPrice,
        highPrice,
        offerCount: product.variants.length,
        offers: product.variants.map((v) => {
          const availableUnits =
            v.inventoryBalances?.reduce((sum, b) => sum + (b.available || 0), 0) ?? 0;
          return {
            "@type": "Offer",
            sku: v.sku,
            priceCurrency: "INR",
            price: v.price,
            availability:
              availableUnits > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          };
        }),
      };
    }
  }

  return jsonLd;
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(breadcrumbs: SeoBreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: b.name,
      item: `${SITE_URL}/categories/${b.slug}`,
    })),
  };
}

/**
 * Generates Schema.org CollectionPage JSON-LD for category catalogs
 */
export function generateCategoryJsonLd(categoryName: string, categorySlug: string, count: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} Catalog`,
    url: `${SITE_URL}/categories/${categorySlug}`,
    description: `Explore our collection of ${categoryName}. Browse ${count} items.`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: count,
    },
  };
}
