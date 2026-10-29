# Phase 10: SEO-First Storefront Architecture, Structured Data & Automated Testing

---

## 1. SEO Architecture & Technical Standards

### A. Google Search Central Compliance
To maximize search visibility and organic discovery without fragile manual work:
1. **Server-Rendered Initial HTML**: Initial page load renders full product semantic markup, headings, prices, specifications, and images on the server before client hydration.
2. **Dynamic BreadcrumbList Schema**: Emits standard schema.org `BreadcrumbList` JSON-LD for rich snippet navigation.
3. **Product & Offer Schema**: Emits rich schema.org `Product` JSON-LD including brand, identifiers (GTIN/EAN/SKU), currency, price, availability status (`https://schema.org/InStock` vs `OutOfStock`), and review ratings when present.
4. **Canonical URL Protection**: Prevents duplicate content penalties across faceted filter combinations and paginated URLs.
5. **Automated 301 Redirects**: When an administrator changes a product or category slug, the old slug is automatically archived in `SeoRedirect` to execute transparent HTTP 301 permanent redirects to preserve backlink juice.

---

## 2. Structured Data Generator Implementation

```typescript
// src/lib/seo/structured-data.ts

export function generateProductJsonLd(product: any, selectedVariant?: any) {
  const variant = selectedVariant || product.variants?.[0];
  const primaryCategory = product.categories?.find((c: any) => c.isPrimary)?.category;

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription || product.title,
    image: product.media?.map((m: any) => m.url) || [],
    sku: variant?.sku || product.code,
    mpn: product.code,
  };

  if (variant?.barcode) {
    jsonLd.gtin13 = variant.barcode;
  }

  if (product.brand) {
    jsonLd.brand = {
      "@type": "Brand",
      name: product.brand.name,
    };
  }

  if (variant) {
    const isAvailable = (variant.inventoryBalances?.[0]?.available ?? 0) > 0;
    jsonLd.offers = {
      "@type": "Offer",
      url: `https://yourdomain.com/products/${product.slug}?variant=${variant.sku}`,
      priceCurrency: "INR",
      price: variant.price,
      availability: isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Enterprise Store",
      },
    };
  }

  return jsonLd;
}

export function generateBreadcrumbJsonLd(breadcrumbs: Array<{ name: string; slug: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: b.name,
      item: `https://yourdomain.com/categories/${b.slug}`,
    })),
  };
}
```

---

## 3. Automated Sitemap & Robots Directives

- **Dynamic XML Sitemap (`src/app/sitemap.ts`)**:
  - Dynamically queries all active Categories, Brands, and Published Products from PostgreSQL using Prisma.
  - Generates `<url>` tags with `<lastmod>`, `<changefreq>`, and `<priority>`:
    - Products: `priority: 0.8`, `changefreq: 'daily'`
    - Categories: `priority: 0.9`, `changefreq: 'weekly'`
- **Robots Directives (`src/app/robots.ts`)**:
  - Disallows internal administrative routes: `/admin/`, `/dashboard/`, `/api/admin/`.
  - Allows public storefront crawl: `/products/`, `/categories/`, `/brands/`.
  - Declares dynamic sitemap location.

---

## 4. Automated Testing Suite

### A. Test Modules to Implement
1. **Cartesian Product Generator Tests (`tests/unit/cartesian.test.ts`)**:
   - Verifies 2-axis, 3-axis, and single-axis variant combinatorial generation.
   - Verifies empty / zero option handling.
2. **Category Cycle Prevention Tests (`tests/unit/category-cycle.test.ts`)**:
   - Tests direct cycle ($A \rightarrow A$).
   - Tests indirect cycle ($A \rightarrow B \rightarrow C \rightarrow A$).
3. **Inventory Concurrency Tests (`tests/integration/inventory.test.ts`)**:
   - Tests simultaneous deductions using Promise.all() ensuring no negative on-hand balance.
   - Tests low-stock alert triggers and movement ledger entries.
4. **Validation Schemas Tests (`tests/unit/validations.test.ts`)**:
   - Tests price validation (compareAtPrice $\ge$ price).
   - Tests SKU format and character constraint rules.
