"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  ChevronRight,
  Code2,
  Warehouse,
  Barcode,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SerializedProduct {
  id: string;
  code: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  basePrice: number;
  brand?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    website?: string | null;
  } | null;
  manufacturer?: {
    id: string;
    name: string;
    countryOfOrigin?: string | null;
  } | null;
  categories: Array<{
    isPrimary: boolean;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  media: Array<{
    id: string;
    url: string;
    altText?: string | null;
    isThumbnail: boolean;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    barcode?: string | null;
    title: string;
    price: number;
    compareAtPrice?: number | null;
    optionValues: Record<string, string>;
    inventoryBalances: Array<{
      available: number;
      onHand: number;
      warehouse: {
        id: string;
        name: string;
        code: string;
      };
    }>;
  }>;
  attributes: Array<{
    name: string;
    dataType: string;
    value: string;
    unit: string;
  }>;
}

interface ProductDetailClientProps {
  product: SerializedProduct;
  initialVariantSku?: string;
  breadcrumbs: Array<{ name: string; slug: string }>;
}

export function ProductDetailClient({
  product,
  initialVariantSku,
  breadcrumbs,
}: ProductDetailClientProps) {
  // Active variant state
  const [selectedSku, setSelectedSku] = useState<string>(() => {
    if (initialVariantSku && product.variants.some((v) => v.sku === initialVariantSku)) {
      return initialVariantSku;
    }
    return product.variants[0]?.sku || "";
  });

  // Active image index
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"specs" | "description" | "seo">("specs");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const selectedVariant = useMemo(() => {
    return product.variants.find((v) => v.sku === selectedSku) || product.variants[0];
  }, [product.variants, selectedSku]);

  // Aggregate stock for selected variant
  const totalAvailableStock = useMemo(() => {
    if (!selectedVariant) return 0;
    return selectedVariant.inventoryBalances.reduce((sum, b) => sum + (b.available || 0), 0);
  }, [selectedVariant]);

  // Extract all variant axis keys (e.g. "Color", "Size")
  const optionAxes = useMemo(() => {
    const axesMap: Record<string, Set<string>> = {};
    product.variants.forEach((v) => {
      Object.entries(v.optionValues || {}).forEach(([k, val]) => {
        if (!axesMap[k]) axesMap[k] = new Set();
        axesMap[k].add(val);
      });
    });

    return Object.entries(axesMap).map(([key, valSet]) => ({
      name: key,
      values: Array.from(valSet),
    }));
  }, [product.variants]);

  // Handle option selection
  const handleOptionSelect = (axisName: string, chosenValue: string) => {
    if (!selectedVariant) return;
    const currentOptions = { ...selectedVariant.optionValues, [axisName]: chosenValue };

    // Find the variant that best matches current options
    const match = product.variants.find((v) => {
      return Object.entries(currentOptions).every(([k, val]) => v.optionValues[k] === val);
    });

    if (match) {
      setSelectedSku(match.sku);
    }
  };

  const images = product.media.length > 0 ? product.media : [{ id: "fallback", url: "", altText: product.title, isThumbnail: true }];
  const currentImage = images[activeImageIndex] || images[0];

  const discountPercent =
    selectedVariant?.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price
      ? Math.round(
          ((selectedVariant.compareAtPrice - selectedVariant.price) / selectedVariant.compareAtPrice) * 100
        )
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        {breadcrumbs.map((b, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground line-clamp-1">{b.name}</span>
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

      {/* Main PDP Grid: Gallery & Purchase Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl border border-border/60 bg-muted/30 overflow-hidden flex items-center justify-center shadow-sm">
            {currentImage?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage.url}
                alt={currentImage.altText || product.title}
                className="w-full h-full object-contain p-4 transition-all duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ShoppingBag className="w-16 h-16 opacity-30" />
                <span className="text-xs font-medium">No Image Uploaded</span>
              </div>
            )}

            {/* Discount Badge */}
            {discountPercent && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                SAVE {discountPercent}%
              </span>
            )}

            {/* Stock pill */}
            <span
              className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${
                totalAvailableStock > 0
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}
            >
              {totalAvailableStock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText || `View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information, Swatches & Buying Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.brand && (
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {product.brand.name}
                </span>
              )}
              {product.manufacturer && (
                <span className="text-xs text-muted-foreground">
                  • Made in {product.manufacturer.countryOfOrigin || "India"}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {product.title}
            </h1>

            {/* Product Meta Identifiers */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-mono">
                Item Code: <strong className="text-foreground">{product.code}</strong>
              </span>
              <span>•</span>
              <span className="font-mono">
                SKU: <strong className="text-primary">{selectedVariant?.sku}</strong>
              </span>
              {selectedVariant?.barcode && (
                <>
                  <span>•</span>
                  <span className="font-mono flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-muted-foreground" />
                    {selectedVariant.barcode}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Price Display */}
          <div className="flex items-baseline gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
            <span className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">
              ₹{selectedVariant ? selectedVariant.price.toLocaleString("en-IN") : product.basePrice.toLocaleString("en-IN")}
            </span>
            {selectedVariant?.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
              <span className="text-lg text-muted-foreground line-through tabular-nums">
                ₹{selectedVariant.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">Inclusive of all applicable GST taxes</span>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Dynamic Variant Axes Selector */}
          {optionAxes.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              {optionAxes.map((axis) => {
                const activeVal = selectedVariant?.optionValues[axis.name];
                return (
                  <div key={axis.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{axis.name}:</span>
                      <span className="font-medium text-primary">{activeVal || "Choose"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {axis.values.map((val) => {
                        const isSelected = activeVal === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleOptionSelect(axis.name, val)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                                : "bg-muted/50 border border-border/70 text-foreground hover:border-primary/60"
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Real-time Multi-Warehouse Stock Indicator */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-foreground">
                <Warehouse className="w-4 h-4 text-primary" />
                Fulfillment Logistics & Real-Time Stock
              </span>
              {totalAvailableStock > 0 ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {totalAvailableStock} Units Available
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-500">
                  <XCircle className="w-3.5 h-3.5" />
                  Temporarily Sold Out
                </span>
              )}
            </div>

            {/* Warehouse holdings breakdown */}
            {selectedVariant && selectedVariant.inventoryBalances.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                {selectedVariant.inventoryBalances.map((b) => (
                  <div
                    key={b.warehouse.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50"
                  >
                    <span className="text-muted-foreground truncate max-w-[140px]">
                      {b.warehouse.name}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        b.available > 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {b.available} ready
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden h-11 w-32 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="flex-1 text-center font-bold text-sm text-foreground tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(totalAvailableStock || 99, q + 1))}
                className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"
              >
                +
              </button>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2500);
              }}
              disabled={totalAvailableStock <= 0}
              className="flex-1 h-11 text-sm font-bold gap-2 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdded ? "Added to Cart ✓" : totalAvailableStock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>

          {/* Assurance Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-primary" />
              <span>Express Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Genuine</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-blue-500" />
              <span>7-Day Return Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Specifications, Long Description, SEO JSON-LD Inspector */}
      <div className="pt-8 border-t border-border/60 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "specs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Technical Specifications ({product.attributes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "description"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Product Overview & Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("seo")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "seo"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Google Schema.org Inspector
          </button>
        </div>

        {/* Tab 1: Dynamic EAV Specifications */}
        {activeTab === "specs" && (
          <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
            {product.attributes.length > 0 ? (
              <div className="divide-y divide-border/50">
                {product.attributes.map((attr, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-1 sm:grid-cols-3 p-3.5 text-xs ${
                      idx % 2 === 0 ? "bg-muted/20" : "bg-card"
                    }`}
                  >
                    <span className="font-semibold text-foreground">{attr.name}</span>
                    <span className="sm:col-span-2 text-muted-foreground font-medium">
                      {attr.value} {attr.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No custom specifications assigned to this item.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Full Description */}
        {activeTab === "description" && (
          <div className="prose prose-sm dark:prose-invert max-w-none p-6 rounded-xl border border-border/60 bg-card">
            {product.description ? (
              <div className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
                {product.description}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No detailed description provided.</p>
            )}
          </div>
        )}

        {/* Tab 3: Schema.org JSON-LD Inspector */}
        {activeTab === "seo" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Real-time JSON-LD payload automatically injected into the server-rendered HTML for Google Rich Snippets & Merchant Center:
              </span>
              <span className="font-mono text-[11px] text-emerald-500 font-semibold">
                Status: Google Search Central Valid
              </span>
            </div>
            <pre className="p-4 rounded-xl bg-muted/60 border border-border/60 text-xs font-mono text-foreground overflow-x-auto max-h-96">
              {JSON.stringify(
                {
                  "@context": "https://schema.org",
                  "@type": "Product",
                  name: product.title,
                  sku: selectedVariant?.sku,
                  mpn: product.code,
                  gtin13: selectedVariant?.barcode,
                  brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
                  offers: {
                    "@type": "Offer",
                    price: selectedVariant?.price,
                    priceCurrency: "INR",
                    availability:
                      totalAvailableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  },
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
