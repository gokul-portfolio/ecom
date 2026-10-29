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
  FolderTree,
  Folder,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  Keyboard,
  Image as ImageIcon,
} from "lucide-react";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations/category";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/form/ImageUpload";
import { getFlattenedTreeWithIndent, buildCategoryTree } from "@/lib/utils/category-tree";

interface CategoryOption {
  id: string;
  name: string;
  level: number;
}

function CategoryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("categories:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoCode, setAutoCode] = useState("CAT001");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Media
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [iconPublicId, setIconPublicId] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerPublicId, setBannerPublicId] = useState<string | null>(null);

  // SEO Metadata
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  // Parent Category Options
  const [parentOptions, setParentOptions] = useState<{ value: string; label: string }[]>([
    { value: "", label: "-- Root Category (No Parent) --" },
  ]);

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

  // Slug auto-generation helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle Name Change with Auto-Slug Generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    clearError("name");

    // Only auto-generate slug if in create mode, or if slug hasn't been manually set differently
    if (!isEditMode) {
      const generated = generateSlug(val);
      setSlug(generated);
      clearError("slug");
    }
  };

  // Keyboard Navigation: Enter moves between form elements
  const { containerRef } = useFormKeyboardNavigation();

  // Keyboard Shortcuts: Ctrl+S to save, Esc to exit, Alt+R to reset
  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/categories");
    },
    onReset: () => {
      handleClearForm();
    },
  });

  // Auto-focus name field on mount
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Load parent categories & Edit Data
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setIsLoading(true);
      try {
        // Fetch all categories for parent dropdown
        const catRes = await fetch("/api/admin/categories?limit=100");
        const catJson = await catRes.json();

        if (isMounted && catJson.success) {
          const allCats = catJson.data || [];
          const tree = buildCategoryTree(allCats);
          const flattened = getFlattenedTreeWithIndent(tree);

          // Exclude self if in edit mode
          const filtered = isEditMode
            ? flattened.filter((c) => c.value !== editId)
            : flattened;

          setParentOptions([
            { value: "", label: "-- Root Category (No Parent) --" },
            ...filtered.map((c) => ({
              value: c.value,
              label: c.label,
            })),
          ]);
        }

        // Fetch Edit Details OR Generate Next Code
        if (isEditMode && editId) {
          const editRes = await fetch(`/api/admin/categories/${editId}`);
          const editJson = await editRes.json();

          if (!editRes.ok || !editJson.success) {
            throw new Error(editJson.error || "Failed to load category details");
          }

          if (isMounted && editJson.data) {
            const cat = editJson.data;
            setName(cat.name || "");
            setSlug(cat.slug || "");
            setAutoCode(cat.code || "CAT001");
            setParentId(cat.parentId || "");
            setDescription(cat.description || "");
            setSortOrder(cat.sortOrder ?? 0);
            setStatus(cat.isActive ? "ACTIVE" : "INACTIVE");
            setIconUrl(cat.iconUrl || null);
            setIconPublicId(cat.iconPublicId || null);
            setBannerUrl(cat.bannerUrl || null);
            setBannerPublicId(cat.bannerPublicId || null);
            setMetaTitle(cat.metaTitle || "");
            setMetaDescription(cat.metaDescription || "");
            setMetaKeywords(cat.metaKeywords || "");
          }
        } else {
          // Generate next code
          const count = catJson.pagination?.totalItems ?? (catJson.data?.length || 0);
          setAutoCode(`CAT${String(count + 1).padStart(3, "0")}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/categories");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [editId, isEditMode, router, toast]);

  const handleClearForm = () => {
    if (isEditMode) return;
    setName("");
    setSlug("");
    setParentId("");
    setDescription("");
    setSortOrder(0);
    setStatus("ACTIVE");
    setIconUrl(null);
    setIconPublicId(null);
    setBannerUrl(null);
    setBannerPublicId(null);
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage categories.");
      }
      return;
    }

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      parentId: parentId || null,
      description: description.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive: status === "ACTIVE",
      iconUrl: iconUrl || undefined,
      iconPublicId: iconPublicId || undefined,
      bannerUrl: bannerUrl || undefined,
      bannerPublicId: bannerPublicId || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      metaKeywords: metaKeywords.trim() || undefined,
    };

    if (isEditMode) {
      const validation = categoryUpdateSchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please review and fix the highlighted fields.");
        return;
      }
    } else {
      const validation = categorySchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please review and fix the highlighted fields.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/categories/${editId}`
        : "/api/admin/categories";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save category");
      }

      toast.success(
        isEditMode ? "Category Updated" : "Category Created",
        `Category "${trimmedName}" has been successfully saved.`
      );

      router.push("/categories");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving category";
      toast.error("Submission Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find parent category name for live breadcrumb preview
  const parentOption = parentOptions.find((o) => o.value === parentId);
  const parentLabel = parentOption && parentOption.value ? parentOption.label.replace(/^[↳\s]+/, "") : null;

  return (
    <div className="w-full space-y-6 text-left pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/categories"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Categories (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Category" : "Create Merchandise Category"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure merchandise category taxonomy, parent inheritance, and storefront SEO parameters.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Main 65% Form / 35% Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 65% Form Inputs (7/12 or 8/12 on lg) */}
        <div
          ref={containerRef as any}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          {/* Card 1: Core Identification */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                1. Core Taxonomy Identification
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {autoCode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Men's Casual Shirts"
                  className={cn(
                    "px-3 py-2 text-xs rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors",
                    errors.name
                      ? "border-rose-400 ring-1 ring-rose-400"
                      : "border-slate-200 dark:border-slate-800"
                  )}
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* URL Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>URL Slug <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">SEO Storefront Path</span>
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="px-2.5 py-2 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                    /category/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                      clearError("slug");
                    }}
                    placeholder="mens-casual-shirts"
                    className="w-full px-3 py-2 text-xs font-mono bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                {errors.slug && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.slug}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Parent Category Selector */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Parent Category
                </label>
                <SelectInput
                  value={parentId}
                  onChange={(val) => {
                    setParentId(val);
                    clearError("parentId");
                  }}
                  options={parentOptions}
                  placeholder="Select Parent Taxonomy..."
                />
                <p className="text-[10px] text-slate-400">
                  Leave as Root Category to create a top-level storefront department.
                </p>
                {errors.parentId && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.parentId}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catalog Status
                </label>
                <SelectInput
                  value={status}
                  onChange={(val) => setStatus(val as "ACTIVE" | "INACTIVE")}
                  options={[
                    { value: "ACTIVE", label: "Active (Published)" },
                    { value: "INACTIVE", label: "Inactive (Draft / Hidden)" },
                  ]}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category Description
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearError("description");
                }}
                rows={3}
                placeholder="Detailed customer-facing description of merchandise in this category..."
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              {errors.description && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Sort Order */}
            <div className="w-40 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Display Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Card 2: Visual Assets (Cloudinary) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                2. Visual Media & Storefront Branding
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Icon */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category Icon / Thumbnail
                </label>
                <ImageUpload
                  value={iconUrl}
                  publicId={iconPublicId}
                  onChange={(url, pid) => {
                    setIconUrl(url);
                    setIconPublicId(pid || null);
                  }}
                  folder="ecommerce/categories/icons"
                  placeholderText="Upload Category Icon"
                  recommendedText="Square SVG, PNG or WebP (Max 2MB)"
                  size="md"
                />
              </div>

              {/* Category Hero Banner */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Storefront Hero Banner
                </label>
                <ImageUpload
                  value={bannerUrl}
                  publicId={bannerPublicId}
                  onChange={(url, pid) => {
                    setBannerUrl(url);
                    setBannerPublicId(pid || null);
                  }}
                  folder="ecommerce/categories/banners"
                  placeholderText="Upload Hero Banner"
                  recommendedText="Recommended 1200x400px (Max 5MB)"
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Card 3: SEO Search Engine Optimization */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-500" />
                3. Search Engine Optimization (SEO Metadata)
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {/* Meta Title */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    SEO Meta Title
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      metaTitle.length > 60 ? "text-amber-500" : "text-slate-400"
                    )}
                  >
                    {metaTitle.length}/60 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={name ? `${name} | Online Store` : "Category Title | Online Store"}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Meta Description */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    SEO Meta Description
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      metaDescription.length > 160 ? "text-amber-500" : "text-slate-400"
                    )}
                  >
                    {metaDescription.length}/160 chars
                  </span>
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  placeholder="Summary of this category for Google search result snippets..."
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Meta Keywords */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SEO Keywords (Comma Separated)
                </label>
                <input
                  type="text"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="shirts, cotton, casual wear, menswear"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {!isEditMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearForm}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Clear Form
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/categories")}
                  disabled={isSubmitting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting}
                disabled={isSubmitting || !canWrite}
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side: 35% Sticky Live Storefront Preview */}
        <div className="lg:col-span-4 sticky top-6 flex flex-col gap-5">
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Live Preview
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                Badge Card
              </span>
            </div>

            {/* Card Badge Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Category"}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      *{autoCode}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border",
                    status === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                  )}
                >
                  {status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {description.trim() || "No operational taxonomy description added yet. Add details on the left."}
              </p>

              {parentLabel && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400">Parent:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{parentLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Operational Best Practices Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category Governance
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Category codes are sequential identifiers (<code className="font-mono text-indigo-500 font-bold">*{autoCode}</code>) used across merchandising.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Cycle prevention automatically blocks assigning a category to itself or its descendants.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Changing a slug automatically creates an HTTP 301 permanent redirect to protect SEO rankings.</span>
              </li>
            </ul>
          </div>
      </div>
    </div>
    </div>
  );
}


export default function CategoryFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading category editor...
        </div>
      }
    >
      <CategoryFormContent />
    </Suspense>
  );
}
