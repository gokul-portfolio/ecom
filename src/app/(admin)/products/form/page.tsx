"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/feedback/Toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFormKeyboardNavigation,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardNavigation";
import {
  ArrowLeft,
  Package,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Search,
  Keyboard,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Tag,
  DollarSign,
  Image as ImageIcon,
  SlidersHorizontal,
  GitMerge,
  Globe,
  Plus,
  Trash2,
  Check,
  Star,
  Ruler,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
} from "lucide-react";
import { productSchema, productUpdateSchema } from "@/lib/validations/product";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/form/ImageUpload";
import { generateVariantMatrix, VariantAxisInput, GeneratedVariantCombination } from "@/lib/utils/cartesian";

interface TaxClassOption {
  id: string;
  name: string;
  rate: number;
}

interface BrandOption {
  id: string;
  name: string;
}

interface ManufacturerOption {
  id: string;
  companyName: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface AttributeOption {
  id: string;
  name: string;
  code: string;
  dataType: string;
  allowedOptions: string[];
  defaultUnit?: string | null;
  isVariantAxis: boolean;
}

interface MediaItem {
  url: string;
  publicId: string;
  altText?: string;
  isThumbnail: boolean;
  sortOrder: number;
}

function ProductFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("products:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Lookups data
  const [taxClasses, setTaxClasses] = useState<TaxClassOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [manufacturers, setManufacturers] = useState<ManufacturerOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);

  // STEP 1: Core Essentials
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [autoCode, setAutoCode] = useState("PRD001");
  const [productType, setProductType] = useState<"PHYSICAL" | "DIGITAL" | "SERVICE">("PHYSICAL");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">("DRAFT");
  const [brandId, setBrandId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  // STEP 2: Pricing & Taxation
  const [basePrice, setBasePrice] = useState<number>(999);
  const [compareAtPrice, setCompareAtPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);
  const [taxClassId, setTaxClassId] = useState("");

  // STEP 3: Media Gallery
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [currentUploadUrl, setCurrentUploadUrl] = useState<string | null>(null);

  // STEP 4: Category Specifications (EAV Values)
  const [attributeValues, setAttributeValues] = useState<{ [attrId: string]: any }>({});

  // STEP 5: Cartesian Variant Matrix Engine
  const [variantAxes, setVariantAxes] = useState<VariantAxisInput[]>([]);
  const [variantRows, setVariantRows] = useState<GeneratedVariantCombination[]>([]);
  const [newAxisName, setNewAxisName] = useState("");
  const [newAxisValues, setNewAxisValues] = useState("");

  // STEP 6: SEO Metadata
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    clearError("title");

    if (!isEditMode) {
      setSlug(generateSlug(val));
      clearError("slug");
    }
  };

  // Keyboard navigation
  const { containerRef } = useFormKeyboardNavigation();

  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/products");
    },
  });

  // Load All Lookups & Edit Data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [taxRes, brandRes, mfgRes, catRes, attrRes] = await Promise.all([
          fetch("/api/admin/tax-classes"),
          fetch("/api/admin/brands?limit=100"),
          fetch("/api/admin/manufacturers?limit=100"),
          fetch("/api/admin/categories?limit=100"),
          fetch("/api/admin/attributes?limit=100"),
        ]);

        const [taxJson, brandJson, mfgJson, catJson, attrJson] = await Promise.all([
          taxRes.json(),
          brandRes.json(),
          mfgRes.json(),
          catRes.json(),
          attrRes.json(),
        ]);

        if (isMounted) {
          if (taxJson.success) {
            setTaxClasses(taxJson.data || []);
            const defaultTax = taxJson.data?.find((t: any) => t.isDefault);
            if (defaultTax) setTaxClassId(defaultTax.id);
          }
          if (brandJson.success) setBrands(brandJson.data || []);
          if (mfgJson.success) setManufacturers(mfgJson.data || []);
          if (catJson.success) setCategories(catJson.data || []);
          if (attrJson.success) setAttributes(attrJson.data || []);
        }

        // Fetch Edit Details OR Generate Next Sequence
        if (isEditMode && editId) {
          const editRes = await fetch(`/api/admin/products/${editId}`);
          const editJson = await editRes.json();

          if (!editRes.ok || !editJson.success) {
            throw new Error(editJson.error || "Failed to load product details");
          }

          if (isMounted && editJson.data) {
            const p = editJson.data;
            setTitle(p.title || "");
            setSlug(p.slug || "");
            setAutoCode(p.code || "PRD001");
            setProductType(p.productType || "PHYSICAL");
            setStatus(p.status || "DRAFT");
            setBrandId(p.brandId || "");
            setManufacturerId(p.manufacturerId || "");
            setSelectedCategoryIds(p.categories?.map((c: any) => c.categoryId) || []);
            setShortDescription(p.shortDescription || "");
            setDescription(p.description || "");
            setBasePrice(p.basePrice || 0);
            setCompareAtPrice(p.compareAtPrice || "");
            setCostPrice(p.costPrice || "");
            setIsTaxInclusive(Boolean(p.isTaxInclusive));
            setTaxClassId(p.taxClassId || "");

            // Media
            if (p.media) {
              setMediaList(
                p.media.map((m: any, idx: number) => ({
                  url: m.url,
                  publicId: m.publicId,
                  altText: m.altText,
                  isThumbnail: m.isThumbnail || idx === 0,
                  sortOrder: m.sortOrder ?? idx,
                }))
              );
            }

            // Variants
            if (p.variants) {
              setVariantRows(
                p.variants.map((v: any) => ({
                  id: v.id,
                  title: v.title,
                  sku: v.sku,
                  barcode: v.barcode || "",
                  optionValues: (v.optionValues as Record<string, string>) || {},
                  price: v.price,
                  compareAtPrice: v.compareAtPrice,
                  costPrice: v.costPrice,
                  weight: v.weight,
                  weightUnit: v.weightUnit || "kg",
                  isDefault: Boolean(v.isDefault),
                  isActive: Boolean(v.isActive),
                }))
              );
            }

            // Attributes
            if (p.attributeValues) {
              const avMap: { [id: string]: any } = {};
              p.attributeValues.forEach((av: any) => {
                avMap[av.attributeId] =
                  av.textValue ?? av.numValue ?? av.boolValue ?? av.jsonValue;
              });
              setAttributeValues(avMap);
            }

            setMetaTitle(p.metaTitle || "");
            setMetaDescription(p.metaDescription || "");
            setCanonicalUrl(p.canonicalUrl || "");
          }
        } else {
          const countRes = await fetch("/api/admin/products?limit=1");
          const countJson = await countRes.json();
          if (isMounted) {
            const count = countJson.metrics?.totalProducts ?? 0;
            setAutoCode(`PRD${String(count + 1).padStart(3, "0")}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/products");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [editId, isEditMode, router, toast]);

  // Variant Matrix: Add an Axis (e.g. Color with values "Red, Blue")
  const handleAddAxis = () => {
    const name = newAxisName.trim();
    const values = newAxisValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (!name || values.length === 0) {
      toast.warning("Incomplete Axis", "Enter an axis name and at least one comma-separated value.");
      return;
    }

    const updatedAxes = [...variantAxes, { name, values }];
    setVariantAxes(updatedAxes);
    setNewAxisName("");
    setNewAxisValues("");

    // Auto-generate Cartesian combinations
    const matrix = generateVariantMatrix(autoCode, basePrice, updatedAxes);
    setVariantRows(matrix);
    toast.success("Combinations Generated", `Generated ${matrix.length} variant SKUs.`);
  };

  const handleRegenerateMatrix = () => {
    if (variantAxes.length === 0) {
      toast.warning("No Axes", "Add at least one variant axis first.");
      return;
    }
    const matrix = generateVariantMatrix(autoCode, basePrice, variantAxes);
    setVariantRows(matrix);
    toast.success("Matrix Updated", `Computed ${matrix.length} variants.`);
  };

  const handleAddUploadedMedia = (url: string | null, publicId?: string | null) => {
    if (!url || !publicId) return;
    const isFirst = mediaList.length === 0;
    const newItem: MediaItem = {
      url,
      publicId,
      altText: title || "Product Image",
      isThumbnail: isFirst,
      sortOrder: mediaList.length,
    };
    setMediaList([...mediaList, newItem]);
    setCurrentUploadUrl(null);
  };

  const handleSetThumbnail = (index: number) => {
    setMediaList(
      mediaList.map((m, i) => ({
        ...m,
        isThumbnail: i === index,
      }))
    );
  };

  const handleRemoveMedia = (index: number) => {
    const updated = mediaList.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((m) => m.isThumbnail)) {
      updated[0].isThumbnail = true;
    }
    setMediaList(updated);
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage products.");
      }
      return;
    }

    if (!title.trim()) {
      setErrors({ title: "Product title is required." });
      setActiveStep(1);
      toast.error("Validation Error", "Product title is required.");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setErrors({ categories: "At least one category must be assigned." });
      setActiveStep(1);
      toast.error("Validation Error", "Select at least one merchandise category.");
      return;
    }

    // Assemble formatted attributes
    const formattedAttributeValues = Object.entries(attributeValues)
      .filter(([_, val]) => val !== undefined && val !== null && val !== "")
      .map(([attrId, val]) => {
        const attrDef = attributes.find((a) => a.id === attrId);
        const isNum = attrDef?.dataType === "NUMBER" || attrDef?.dataType === "MEASUREMENT";
        const isBool = attrDef?.dataType === "BOOLEAN";

        return {
          attributeId: attrId,
          textValue: !isNum && !isBool ? String(val) : null,
          numValue: isNum ? Number(val) : null,
          boolValue: isBool ? Boolean(val) : null,
          unit: attrDef?.defaultUnit || null,
        };
      });

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      productType,
      status,
      basePrice: Number(basePrice) || 0,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      costPrice: costPrice ? Number(costPrice) : undefined,
      isTaxInclusive,
      taxClassId: taxClassId || undefined,
      brandId: brandId || undefined,
      manufacturerId: manufacturerId || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      canonicalUrl: canonicalUrl.trim() || undefined,
      categoryIds: selectedCategoryIds,
      primaryCategoryId: selectedCategoryIds[0],
      media: mediaList,
      variants: variantRows,
      attributeValues: formattedAttributeValues,
    };

    if (isEditMode) {
      const validation = productUpdateSchema.safeParse(payload);
      if (!validation.success) {
        toast.error("Validation Error", validation.error.issues[0].message);
        return;
      }
    } else {
      const validation = productSchema.safeParse(payload);
      if (!validation.success) {
        toast.error("Validation Error", validation.error.issues[0].message);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/products/${editId}`
        : "/api/admin/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save product");
      }

      toast.success(
        isEditMode ? "Product Updated" : "Product Created",
        `Product "${title}" has been successfully saved.`
      );

      router.push("/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving product";
      toast.error("Submission Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview calculations
  const thumbnail = mediaList.find((m) => m.isThumbnail) || mediaList[0];
  const selectedBrand = brands.find((b) => b.id === brandId);
  const selectedTaxClass = taxClasses.find((t) => t.id === taxClassId);
  const discountPercent =
    compareAtPrice && Number(compareAtPrice) > basePrice
      ? Math.round(((Number(compareAtPrice) - basePrice) / Number(compareAtPrice)) * 100)
      : 0;

  return (
    <div className="w-full space-y-6 text-left pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Catalog (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Product" : "Create Product"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure product taxonomy, media assets, dynamic specifications, and Cartesian variant matrix.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={submitForm}
            loading={isSubmitting}
            disabled={isSubmitting || !canWrite}
            className="rounded-xl shadow-xs"
          >
            {isEditMode ? "Save Product" : "Publish Product"}
          </Button>
        </div>
      </div>

      {/* 6-Step Wizard Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {[
          { step: 1, title: "1. Essentials", icon: Package },
          { step: 2, title: "2. Pricing & Tax", icon: DollarSign },
          { step: 3, title: "3. Media Gallery", icon: ImageIcon },
          { step: 4, title: "4. Specifications", icon: SlidersHorizontal },
          { step: 5, title: "5. Variant Matrix", icon: GitMerge },
          { step: 6, title: "6. Storefront SEO", icon: Globe },
        ].map(({ step, title, icon: Icon }) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(step)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap",
              activeStep === step
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {title}
          </button>
        ))}
      </div>

      {/* Main 65% Wizard Form / 35% Live Storefront PDP Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 65% Wizard Inputs */}
        <div
          ref={containerRef as any}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          {/* STEP 1: Core Essentials */}
          {activeStep === 1 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-500" />
                  Step 1: Product Essentials & Taxonomy
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {autoCode}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Product Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Luxury Egyptian Cotton Shirt"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.title && (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Slug */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Storefront Slug <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">PDP URL</span>
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                    <span className="px-2.5 py-2 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                      /product/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="luxury-cotton-shirt"
                      className="w-full px-3 py-2 text-xs font-mono bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Category Assignment Multi-Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Merchandise Categories <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 min-h-[44px]">
                  {categories.map((c) => {
                    const isSelected = selectedCategoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                          } else {
                            setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                          }
                          clearError("categories");
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {errors.categories && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.categories}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Merchandise Brand
                  </label>
                  <SelectInput
                    value={brandId}
                    onChange={(val) => setBrandId(val)}
                    options={[
                      { value: "", label: "-- None / Generic --" },
                      ...brands.map((b) => ({ value: b.id, label: b.name })),
                    ]}
                  />
                </div>

                {/* Manufacturer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Producer / Manufacturer
                  </label>
                  <SelectInput
                    value={manufacturerId}
                    onChange={(val) => setManufacturerId(val)}
                    options={[
                      { value: "", label: "-- Unspecified --" },
                      ...manufacturers.map((m) => ({ value: m.id, label: m.companyName })),
                    ]}
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Storefront Status
                  </label>
                  <SelectInput
                    value={status}
                    onChange={(val) => setStatus(val as any)}
                    options={[
                      { value: "DRAFT", label: "Draft (Staged)" },
                      { value: "PUBLISHED", label: "Published (Live)" },
                      { value: "ARCHIVED", label: "Archived" },
                    ]}
                  />
                </div>
              </div>

              {/* Short & Full Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Short Teaser (1-2 sentences)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Catchy highlight summary for catalog browsing and storefront card..."
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Rich Description & Story
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Complete customer-facing details, fabric/materials, craftsmanship, and usage guide..."
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Pricing & Commercials */}
          {activeStep === 2 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Step 2: Pricing, GST Tax Slabs & Commercials
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Base Selling Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Compare At Price (M.R.P.) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>M.R.P. Strike-Through (₹)</span>
                    {discountPercent > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : "")}
                    placeholder="e.g. 1499"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Cost Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Cost Price / COGS (₹)</span>
                    <span className="text-[10px] text-slate-400">Internal</span>
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value ? parseFloat(e.target.value) : "")}
                    placeholder="e.g. 450"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Tax Class Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Applicable GST Tax Class Slabs
                  </label>
                  <SelectInput
                    value={taxClassId}
                    onChange={(val) => setTaxClassId(val)}
                    options={taxClasses.map((t) => ({
                      value: t.id,
                      label: `${t.name} (${t.rate}%)`,
                    }))}
                  />
                </div>

                {/* Tax Inclusivity Toggle */}
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isTaxInclusive}
                      onChange={(e) => setIsTaxInclusive(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Selling Price is Inclusive of GST
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Recommended for B2C consumer storefronts in India
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Media Gallery */}
          {activeStep === 3 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  Step 3: Visual Media Gallery & Cloudinary Imagery
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {mediaList.length} photos uploaded
                </span>
              </div>

              {/* Upload Input */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <ImageUpload
                  value={currentUploadUrl}
                  onChange={handleAddUploadedMedia}
                  folder="ecommerce/products/gallery"
                  placeholderText="Upload Product Photograph"
                  recommendedText="Square or 3:4 portrait photo (Max 10MB)"
                  size="md"
                />
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mediaList.map((m, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden aspect-square shadow-sm"
                  >
                    <Image
                      src={m.url}
                      alt={m.altText || "Gallery"}
                      fill
                      className="object-cover"
                    />

                    {/* Thumbnail Badge */}
                    {m.isThumbnail && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        Main Cover
                      </span>
                    )}

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!m.isThumbnail && (
                        <button
                          type="button"
                          onClick={() => handleSetThumbnail(idx)}
                          className="p-1.5 rounded-lg bg-white/90 text-slate-900 text-[10px] font-bold hover:bg-white"
                          title="Set as Main Cover Photo"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Category Specifications (EAV) */}
          {activeStep === 4 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                  Step 4: Dynamic Category Technical Specifications
                </h2>
              </div>

              {attributes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No dynamic attributes created yet. Configure attributes in the Dynamic Attribute Engine.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>{attr.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {attr.dataType} {attr.defaultUnit ? `(${attr.defaultUnit})` : ""}
                        </span>
                      </label>

                      {attr.dataType === "TEXT" && (
                        <input
                          type="text"
                          value={attributeValues[attr.id] || ""}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.id]: e.target.value })
                          }
                          className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      )}

                      {attr.dataType === "NUMBER" && (
                        <input
                          type="number"
                          value={attributeValues[attr.id] || ""}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.id]: e.target.value })
                          }
                          className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      )}

                      {attr.dataType === "MEASUREMENT" && (
                        <div className="flex items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                          <input
                            type="number"
                            value={attributeValues[attr.id] || ""}
                            onChange={(e) =>
                              setAttributeValues({ ...attributeValues, [attr.id]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-transparent focus:outline-none"
                          />
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500">
                            {attr.defaultUnit || "unit"}
                          </span>
                        </div>
                      )}

                      {(attr.dataType === "SINGLE_SELECT" || attr.dataType === "MULTI_SELECT") && (
                        <select
                          value={attributeValues[attr.id] || ""}
                          onChange={(e) =>
                            setAttributeValues({ ...attributeValues, [attr.id]: e.target.value })
                          }
                          className="px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <option value="">-- Choose {attr.name} --</option>
                          {attr.allowedOptions?.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {attr.dataType === "BOOLEAN" && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(attributeValues[attr.id])}
                            onChange={(e) =>
                              setAttributeValues({ ...attributeValues, [attr.id]: e.target.checked })
                            }
                            className="rounded text-indigo-600"
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Yes / Certified / Included
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Cartesian Variant Matrix Engine */}
          {activeStep === 5 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-indigo-500" />
                  Step 5: Cartesian Variant Matrix Engine
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateMatrix}
                  className="text-xs h-7"
                >
                  Recalculate Matrix
                </Button>
              </div>

              {/* Axis Creator */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Define Variant Combination Axes (e.g. Color, Size, Capacity)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newAxisName}
                    onChange={(e) => setNewAxisName(e.target.value)}
                    placeholder="Axis Name (e.g. Color)"
                    className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={newAxisValues}
                    onChange={(e) => setNewAxisValues(e.target.value)}
                    placeholder="Comma values (e.g. Red, Blue, Black)"
                    className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAxis}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Axis & Compute
                  </Button>
                </div>

                {/* Defined Axes Pills */}
                {variantAxes.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {variantAxes.map((axis, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                      >
                        {axis.name}: [{axis.values.join(", ")}]
                        <button
                          type="button"
                          onClick={() => {
                            const updated = variantAxes.filter((_, idx) => idx !== i);
                            setVariantAxes(updated);
                            setVariantRows(generateVariantMatrix(autoCode, basePrice, updated));
                          }}
                          className="hover:text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5 font-bold">Variant Title</th>
                      <th className="p-2.5 font-bold">SKU Code</th>
                      <th className="p-2.5 font-bold">Barcode (EAN-13)</th>
                      <th className="p-2.5 font-bold">Price (₹)</th>
                      <th className="p-2.5 font-bold">Initial Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {variantRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                          No variant combinations generated yet. A single default SKU will be generated automatically if left empty.
                        </td>
                      </tr>
                    ) : (
                      variantRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/50">
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                            {row.title}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.sku}
                              onChange={(e) => {
                                const next = [...variantRows];
                                next[idx].sku = e.target.value;
                                setVariantRows(next);
                              }}
                              className="px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-36"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.barcode}
                              onChange={(e) => {
                                const next = [...variantRows];
                                next[idx].barcode = e.target.value;
                                setVariantRows(next);
                              }}
                              className="px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-36"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={row.price}
                              onChange={(e) => {
                                const next = [...variantRows];
                                next[idx].price = parseFloat(e.target.value) || 0;
                                setVariantRows(next);
                              }}
                              className="px-2 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-24"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              value={row.initialStock ?? 10}
                              onChange={(e) => {
                                const next = [...variantRows];
                                next[idx].initialStock = parseInt(e.target.value) || 0;
                                setVariantRows(next);
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-20 text-emerald-600"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 6: Storefront SEO */}
          {activeStep === 6 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  Step 6: Search Engine Optimization & Structured Data
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title ? `${title} | Buy Online` : "Product Title | Buy Online"}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Meta Description
                  </label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={2}
                    placeholder="Short summary of this product for Google search engine results..."
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Canonical Storefront URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://yourstore.com/products/luxury-shirt"
                    className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wizard Step Navigation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeStep === 1}
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              className="text-xs gap-1 h-8"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous Step
            </Button>

            {activeStep < 6 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveStep(activeStep + 1)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 h-8"
              >
                Next Step
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={submitForm}
                loading={isSubmitting}
                disabled={isSubmitting || !canWrite}
                className="rounded-xl shadow-xs"
              >
                {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Finish & Publish"}
              </Button>
            )}
          </div>
        </div>

        {/* Right Side: 35% Live Storefront PDP Preview Card */}
        <div className="lg:col-span-4 sticky top-6 flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Storefront PDP Preview
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                )}
              >
                {status}
              </span>
            </div>

            {/* Thumbnail Showcase */}
            <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
              {thumbnail ? (
                <Image
                  src={thumbnail.url}
                  alt={title || "Product"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-xs">No media uploaded</span>
                </div>
              )}
            </div>

            {/* Product Meta */}
            <div className="p-4 flex flex-col gap-2.5">
              {selectedBrand && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {selectedBrand.name}
                </span>
              )}

              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {title || "Product Title Preview"}
              </h3>

              {/* Price Row */}
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  ₹{basePrice.toLocaleString("en-IN")}
                </span>
                {compareAtPrice && Number(compareAtPrice) > basePrice && (
                  <>
                    <span className="text-xs line-through text-slate-400">
                      ₹{Number(compareAtPrice).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                      {discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>

              {selectedTaxClass && (
                <span className="text-[10px] text-slate-400">
                  {isTaxInclusive ? "Inclusive of" : "Excludes"} {selectedTaxClass.name}
                </span>
              )}

              {/* Simulated Variant Selector Chips */}
              {variantAxes.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  {variantAxes.map((axis, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {axis.name}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {axis.values.map((v, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-medium border",
                              idx === 0
                                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold"
                                : "border-slate-200 dark:border-slate-700 text-slate-600"
                            )}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stock Indicator */}
              <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock — Ready to ship</span>
              </div>
            </div>

            {/* Google Search Snippet */}
            <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                <Search className="w-3 h-3 text-blue-500" />
                Google Search Result SERP
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5 text-left">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-mono truncate">
                  https://yourstore.com/product/{slug || "item-slug"}
                </span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">
                  {metaTitle || (title ? `${title} | Storefront` : "Product Details")}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                  {metaDescription || shortDescription || "Explore best deals and instant delivery."}
                </p>
              </div>
            </div>
          </div>

          {/* Catalog Governance Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Catalog Governance
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>SKUs and barcodes are unique across all physical facilities and warehouse ledgers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Draft products remain invisible to public customers on storefront search and catalog pages.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Variant combinations automatically inherit category taxonomy and pricing tier rules.</span>
              </li>
            </ul>
          </div>

          {/* Quick Keyboard Reference */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              Shortcuts:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+S</kbd> Save</span>
              <span><kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> Exit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading product builder...
        </div>
      }
    >
      <ProductFormContent />
    </Suspense>
  );
}
