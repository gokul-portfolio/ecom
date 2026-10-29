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
  Award,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  Globe,
  Sparkles,
  Search,
  ExternalLink,
  Keyboard,
  Flag,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { brandSchema, brandUpdateSchema } from "@/lib/validations/brand";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/form/ImageUpload";

function BrandFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("brands:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoCode, setAutoCode] = useState("BRD001");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Media
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPublicId, setLogoPublicId] = useState<string | null>(null);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    clearError("name");

    if (!isEditMode) {
      setSlug(generateSlug(val));
      clearError("slug");
    }
  };

  // Keyboard Navigation: Enter moves between inputs
  const { containerRef } = useFormKeyboardNavigation();

  // Keyboard Shortcuts: Ctrl+S to save, Esc to exit, Alt+R to reset
  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/brands");
    },
    onReset: () => {
      handleClearForm();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Load Initial Data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        if (isEditMode && editId) {
          const res = await fetch(`/api/admin/brands/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load brand details");
          }

          if (isMounted && json.data) {
            const b = json.data;
            setName(b.name || "");
            setSlug(b.slug || "");
            setAutoCode(b.code || "BRD001");
            setWebsiteUrl(b.website || "");
            setCountryOfOrigin(b.countryOfOrigin || "India");
            setDescription(b.description || "");
            setStatus(b.isActive ? "ACTIVE" : "INACTIVE");
            setLogoUrl(b.logoUrl || null);
            setLogoPublicId(b.logoPublicId || null);
            setMetaTitle(b.metaTitle || "");
            setMetaDescription(b.metaDescription || "");
          }
        } else {
          const res = await fetch("/api/admin/brands?limit=1");
          const json = await res.json();
          if (isMounted) {
            const count = json.metrics?.totalBrands ?? 0;
            setAutoCode(`BRD${String(count + 1).padStart(3, "0")}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/brands");
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

  const handleClearForm = () => {
    if (isEditMode) return;
    setName("");
    setSlug("");
    setWebsiteUrl("");
    setCountryOfOrigin("India");
    setDescription("");
    setStatus("ACTIVE");
    setLogoUrl(null);
    setLogoPublicId(null);
    setMetaTitle("");
    setMetaDescription("");
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage brands.");
      }
      return;
    }

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      description: description.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      countryOfOrigin: countryOfOrigin.trim() || "India",
      isActive: status === "ACTIVE",
      logoUrl: logoUrl || undefined,
      logoPublicId: logoPublicId || undefined,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
    };

    if (isEditMode) {
      const validation = brandUpdateSchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please check the highlighted fields.");
        return;
      }
    } else {
      const validation = brandSchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please check the highlighted fields.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/brands/${editId}`
        : "/api/admin/brands";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save brand");
      }

      toast.success(
        isEditMode ? "Brand Updated" : "Brand Created",
        `Brand "${trimmedName}" has been successfully saved.`
      );

      router.push("/brands");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving brand";
      toast.error("Submission Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-left pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/brands"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Brands (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Brand" : "Create Brand"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure marketing brand credentials, official logos, and storefront SEO metadata.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* 2-COLUMN SPLIT MASTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 65% Primary Form Inputs */}
        <div className="lg:col-span-8 space-y-6">
          <form
            ref={containerRef as any}
            onSubmit={(e) => {
              e.preventDefault();
              submitForm();
            }}
            noValidate
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 sm:p-7 space-y-6 text-left"
          >
            {/* Step 01: Identification & Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand Identification
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Brand Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    suppressHydrationWarning
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Nike, Apple, Zara"
                    value={name}
                    onChange={handleNameChange}
                    className={cn(
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all",
                      isSubmitting && "opacity-60 cursor-not-allowed",
                      errors.name
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    )}
                  />
                  {errors.name && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    The consumer brand name prominently displayed in product cards and filters.
                  </p>
                </div>

                {/* URL Slug */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Storefront Slug <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500">
                    <span className="px-3 py-2 text-xs font-mono text-slate-400 bg-slate-100/70 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800">
                      /brand/
                    </span>
                    <input
                      type="text"
                      disabled={isSubmitting}
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                        clearError("slug");
                      }}
                      placeholder="nike"
                      className="w-full h-10 px-3 text-xs font-mono bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  {errors.slug && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.slug}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    URL identifier for dedicated brand marketing and product landing pages.
                  </p>
                </div>

                {/* Country of Origin */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. India, USA, Italy, Germany"
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Jurisdiction where headquarters or design origins are based.
                  </p>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Catalog Status <span className="text-rose-500">*</span>
                  </label>
                  <SelectInput
                    options={[
                      { value: "ACTIVE", label: "Active (Visible in Catalog)" },
                      { value: "INACTIVE", label: "Inactive (Hidden)" },
                    ]}
                    value={status}
                    disabled={isSubmitting}
                    placeholder="Select status..."
                    clearable={false}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  />
                  <p className="text-[11px] text-slate-400">
                    Inactive brands are suppressed from public customer search and navigation.
                  </p>
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Official Website
                </label>
                <input
                  type="url"
                  disabled={isSubmitting}
                  value={websiteUrl}
                  onChange={(e) => {
                    setWebsiteUrl(e.target.value);
                    clearError("websiteUrl");
                  }}
                  placeholder="https://www.brandwebsite.com"
                  className={cn(
                    "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all",
                    errors.websiteUrl
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                      : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  )}
                />
                {errors.websiteUrl && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.websiteUrl}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Step 02: Brand Logo & Media */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand Logo & Visual Identity
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 3</span>
              </div>

              <div className="space-y-2">
                <ImageUpload
                  value={logoUrl}
                  publicId={logoPublicId}
                  onChange={(url, pid) => {
                    setLogoUrl(url);
                    setLogoPublicId(pid || null);
                  }}
                  folder="ecommerce/brands/logos"
                  placeholderText="Upload Brand Logo"
                  recommendedText="Transparent PNG or SVG recommended (Square or Wide, Max 2MB)"
                  size="md"
                />
              </div>
            </div>

            {/* Step 03: Story & SEO */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    03
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Brand Story & Search Engine Optimization
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 3 of 3</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Brand Story & Heritage
                </label>
                <textarea
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Heritage, craftsmanship, ethos, and marketplace positioning of this brand..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      SEO Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {metaTitle.length}/70
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={name ? `${name} Official Online Store` : "Brand Store"}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      SEO Description
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Summary for search results..."
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
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
                  onClick={() => router.push("/brands")}
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
                {isEditMode ? "Save Brand" : "Create Brand"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: 35% Live Preview & Governance Checklist */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                Badge Card
              </span>
            </div>

            {/* Card Badge Output */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center relative overflow-hidden shrink-0 border border-indigo-200/30">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        fill
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <Award className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Brand"}
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

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Flag className="w-3 h-3 text-slate-400" />
                  {countryOfOrigin || "India"}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  /brand/{slug || "slug"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {description.trim() || "No brand story or description added yet. Add details on the left."}
              </p>
            </div>
          </div>

          {/* Brand Governance Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Brand Governance
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Brand codes (<code className="font-mono text-indigo-500 font-bold">*BRD00X</code>) are unique identifiers linked to SKU barcoding.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Slugs auto-generate from brand names and power the customer storefront filters.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Inactive brands will suppress all associated products from search recommendations.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BrandFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading brand editor...
        </div>
      }
    >
      <BrandFormContent />
    </Suspense>
  );
}
