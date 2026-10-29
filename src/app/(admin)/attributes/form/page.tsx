"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/feedback/Toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFormKeyboardNavigation,
  useKeyboardShortcuts,
} from "@/hooks/useKeyboardNavigation";
import {
  ArrowLeft,
  SlidersHorizontal,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Keyboard,
  GitMerge,
  Filter,
  Search,
  Plus,
  X,
  Ruler,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Eye,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { attributeSchema, attributeUpdateSchema } from "@/lib/validations/attribute";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";

type DataTypeOption = "TEXT" | "NUMBER" | "BOOLEAN" | "SINGLE_SELECT" | "MULTI_SELECT" | "MEASUREMENT" | "DATE";

function AttributeFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("attributes:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [dataType, setDataType] = useState<DataTypeOption>("TEXT");
  const [allowedOptions, setAllowedOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");
  const [unitGroup, setUnitGroup] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("");
  const [isVariantAxis, setIsVariantAxis] = useState(false);
  const [isFilterable, setIsFilterable] = useState(true);
  const [isSearchable, setIsSearchable] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Interactive Live Preview State
  const [previewValue, setPreviewValue] = useState<any>("");

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

  const generateCode = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/[\s-]+/g, "_");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    clearError("name");

    if (!isEditMode) {
      setCode(generateCode(val));
      clearError("code");
    }
  };

  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    if (allowedOptions.includes(trimmed)) {
      toast.warning("Duplicate Option", `Option "${trimmed}" is already added.`);
      return;
    }
    setAllowedOptions([...allowedOptions, trimmed]);
    setOptionInput("");
  };

  const handleRemoveOption = (index: number) => {
    setAllowedOptions(allowedOptions.filter((_, i) => i !== index));
  };

  // Keyboard Navigation: Enter moves between inputs
  const { containerRef } = useFormKeyboardNavigation();

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/attributes");
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
          const res = await fetch(`/api/admin/attributes/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load attribute details");
          }

          if (isMounted && json.data) {
            const a = json.data;
            setName(a.name || "");
            setCode(a.code || "");
            setDataType(a.dataType || "TEXT");
            setAllowedOptions((a.allowedOptions as string[]) || []);
            setUnitGroup(a.unitGroup || "");
            setDefaultUnit(a.defaultUnit || "");
            setIsVariantAxis(Boolean(a.isVariantAxis));
            setIsFilterable(Boolean(a.isFilterable));
            setIsSearchable(Boolean(a.isSearchable));
            setIsActive(Boolean(a.isActive));
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/attributes");
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
    setCode("");
    setDataType("TEXT");
    setAllowedOptions([]);
    setOptionInput("");
    setUnitGroup("");
    setDefaultUnit("");
    setIsVariantAxis(false);
    setIsFilterable(true);
    setIsSearchable(false);
    setIsActive(true);
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage attributes.");
      }
      return;
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    const payload = {
      name: trimmedName,
      code: trimmedCode,
      dataType,
      allowedOptions:
        dataType === "SINGLE_SELECT" || dataType === "MULTI_SELECT"
          ? allowedOptions
          : [],
      unitGroup: dataType === "MEASUREMENT" ? unitGroup.trim() || undefined : undefined,
      defaultUnit: dataType === "MEASUREMENT" ? defaultUnit.trim() || undefined : undefined,
      isVariantAxis,
      isFilterable,
      isSearchable,
      isActive,
    };

    if (isEditMode) {
      const validation = attributeUpdateSchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please review the highlighted fields.");
        return;
      }
    } else {
      const validation = attributeSchema.safeParse(payload);
      if (!validation.success) {
        const fieldErrors: { [key: string]: string } = {};
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Validation Error", "Please review the highlighted fields.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/attributes/${editId}`
        : "/api/admin/attributes";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save attribute");
      }

      toast.success(
        isEditMode ? "Attribute Updated" : "Attribute Created",
        `Attribute "${trimmedName}" has been successfully saved.`
      );

      router.push("/attributes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving attribute";
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
            href="/attributes"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Attributes (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Attribute" : "Create Attribute"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{code || "attr_code"}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure dynamic data typing, variant axes, and customer search facets.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/attributes"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Main 65% Form / 35% Live Interactive Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: 65% Form Inputs */}
        <div
          ref={containerRef as any}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          {/* Card 1: Core Identification & Type */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                1. Attribute Identification & Data Type
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Attribute Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Attribute Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Size, Color, Screen Size, SPF Rating"
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

              {/* Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>System Code <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400">snake_case</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
                    clearError("code");
                  }}
                  placeholder="e.g. apparel_size, screen_size"
                  className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.code && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    {errors.code}
                  </p>
                )}
              </div>
            </div>

            {/* Data Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Data Storage & Input Type <span className="text-rose-500">*</span>
              </label>
              <SelectInput
                value={dataType}
                onChange={(val) => setDataType(val as DataTypeOption)}
                options={[
                  { value: "TEXT", label: "Text String (Freeform single-line or brief sentence)" },
                  { value: "NUMBER", label: "Numeric Value (Integer or Decimal stepper)" },
                  { value: "BOOLEAN", label: "Boolean Toggle (Yes / No, True / False)" },
                  { value: "SINGLE_SELECT", label: "Single Select Dropdown / Swatch (Pick one option)" },
                  { value: "MULTI_SELECT", label: "Multi Select Tags (Select multiple options)" },
                  { value: "MEASUREMENT", label: "Measurement Dimension (Number with physical Unit e.g. cm, kg, ml)" },
                  { value: "DATE", label: "Date Timestamp (Manufacturing / Expiry / Vintage Date)" },
                ]}
              />
            </div>
          </div>

          {/* Card 2: Conditional Options Builder (for SELECT types) */}
          {(dataType === "SINGLE_SELECT" || dataType === "MULTI_SELECT") && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-500" />
                  2. Predefined Allowed Options / Swatches
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {allowedOptions.length} options defined
                </span>
              </div>

              {/* Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Type option and press Enter (e.g. Small, Red, 256GB)..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddOption}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>

              {/* Rendered Option Pills */}
              <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {allowedOptions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No options added yet. Add options above (e.g. XS, S, M, L, XL for apparel sizes).
                  </p>
                ) : (
                  allowedOptions.map((opt, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Card 3: Conditional Measurement Settings (for MEASUREMENT type) */}
          {dataType === "MEASUREMENT" && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-emerald-500" />
                  2. Physical Measurement Unit System
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Unit Group / Dimension
                  </label>
                  <SelectInput
                    value={unitGroup}
                    onChange={(val) => {
                      setUnitGroup(val);
                      if (val === "LENGTH") setDefaultUnit("cm");
                      if (val === "WEIGHT") setDefaultUnit("g");
                      if (val === "VOLUME") setDefaultUnit("ml");
                      if (val === "POWER") setDefaultUnit("W");
                      if (val === "DIGITAL") setDefaultUnit("GB");
                    }}
                    options={[
                      { value: "LENGTH", label: "Length / Distance (cm, mm, m, in, ft)" },
                      { value: "WEIGHT", label: "Weight / Mass (g, kg, mg, oz, lb)" },
                      { value: "VOLUME", label: "Liquid Volume / Capacity (ml, L, fl oz)" },
                      { value: "POWER", label: "Power & Energy (W, kW, mAh, V)" },
                      { value: "DIGITAL", label: "Digital Storage (MB, GB, TB)" },
                      { value: "CUSTOM", label: "Custom Physical Dimension" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default Unit Suffix
                  </label>
                  <input
                    type="text"
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    placeholder="e.g. cm, kg, ml, W"
                    className="px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card 4: Storefront & Variant Capabilities */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                3. Variant Matrix & Storefront Capabilities
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {/* isVariantAxis */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isVariantAxis}
                  onChange={(e) => setIsVariantAxis(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <GitMerge className="w-3.5 h-3.5 text-indigo-600" />
                    Variant Matrix Axis
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    When enabled, this attribute generates product SKU variants via Cartesian product (e.g. Size x Color combinations).
                  </span>
                </div>
              </label>

              {/* isFilterable */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isFilterable}
                  onChange={(e) => setIsFilterable(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-emerald-600" />
                    Faceted Search Sidebar Filter
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Renders as a filterable facet on the customer-facing category search sidebar.
                  </span>
                </div>
              </label>

              {/* isSearchable */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isSearchable}
                  onChange={(e) => setIsSearchable(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    Full-Text Search Indexing
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Indexes values of this attribute so customer searches can match product attributes.
                  </span>
                </div>
              </label>
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
                  onClick={() => router.push("/attributes")}
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
                onClick={submitForm}
                loading={isSubmitting}
                disabled={isSubmitting || !canWrite}
                className="rounded-xl shadow-xs"
              >
                {isEditMode ? "Save Attribute" : "Create Attribute"}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 35% Live Control Simulation & Governance */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          {/* Live Control Simulation Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                Control Simulation
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {name.trim() || "Untitled Attribute"}
                  </h4>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    *{code || "attr_code"}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {dataType}
                </span>
              </div>

              {/* Dynamic Simulated Widget Rendering */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Store Manager Input Widget:
                </span>

                {dataType === "TEXT" && (
                  <input
                    type="text"
                    value={previewValue}
                    onChange={(e) => setPreviewValue(e.target.value)}
                    placeholder="Enter text specification..."
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                )}

                {dataType === "NUMBER" && (
                  <input
                    type="number"
                    value={previewValue}
                    onChange={(e) => setPreviewValue(e.target.value)}
                    placeholder="0"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                )}

                {dataType === "BOOLEAN" && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewValue(!previewValue)}
                      className={cn(
                        "w-10 h-6 flex items-center rounded-full p-1 transition-colors",
                        previewValue ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <div
                        className={cn(
                          "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform",
                          previewValue ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {previewValue ? "Yes / Enabled" : "No / Disabled"}
                    </span>
                  </div>
                )}

                {dataType === "SINGLE_SELECT" && (
                  <div className="flex flex-wrap gap-1.5">
                    {allowedOptions.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No options defined yet</span>
                    ) : (
                      allowedOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewValue(opt)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                            previewValue === opt
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          )}
                        >
                          {opt}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {dataType === "MULTI_SELECT" && (
                  <div className="flex flex-wrap gap-1.5">
                    {allowedOptions.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No options defined yet</span>
                    ) : (
                      allowedOptions.map((opt, i) => {
                        const isSelected = Array.isArray(previewValue) && previewValue.includes(opt);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const current = Array.isArray(previewValue) ? previewValue : [];
                              if (current.includes(opt)) {
                                setPreviewValue(current.filter((x: string) => x !== opt));
                              } else {
                                setPreviewValue([...current, opt]);
                              }
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors",
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            {opt}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {dataType === "MEASUREMENT" && (
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <input
                      type="number"
                      value={previewValue}
                      onChange={(e) => setPreviewValue(e.target.value)}
                      placeholder="0.0"
                      className="w-full h-9 px-3 text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {defaultUnit || "unit"}
                    </span>
                  </div>
                )}

                {dataType === "DATE" && (
                  <input
                    type="date"
                    value={previewValue}
                    onChange={(e) => setPreviewValue(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                )}
              </div>

              {isFilterable && (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col gap-1 text-xs">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Storefront Faceted Filter
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Will render as interactive filtering facet on catalog browsing screens.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attribute Governance Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Attribute Governance
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Attribute codes (<code className="font-mono text-indigo-500 font-bold">*snake_case</code>) form immutable database JSON keys for product specifications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Variant axes drive the product matrix generator; changing allowed options updates child variant schemas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Faceted filters automatically appear on customer category browsing sidebars.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttributeFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading attribute editor...
        </div>
      }
    >
      <AttributeFormContent />
    </Suspense>
  );
}
