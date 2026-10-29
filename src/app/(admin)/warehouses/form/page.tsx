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
  Warehouse,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
  Keyboard,
  Flag,
  MapPin,
  Phone,
  Building,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";

function WarehouseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("inventory:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [autoCode, setAutoCode] = useState("WH001");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [pincode, setPincode] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

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

  // Keyboard navigation
  const { containerRef } = useFormKeyboardNavigation();

  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/warehouses");
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
          const res = await fetch(`/api/admin/warehouses/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load warehouse details");
          }

          if (isMounted && json.data) {
            const w = json.data;
            setName(w.name || "");
            setAutoCode(w.code || "WH001");
            setAddress(w.address || "");
            setCity(w.city || "");
            setState(w.state || "");
            setCountry(w.country || "India");
            setPincode(w.pincode || "");
            setContactPhone(w.contactPhone || "");
            setStatus(w.isActive ? "ACTIVE" : "INACTIVE");
          }
        } else {
          const res = await fetch("/api/admin/warehouses");
          const json = await res.json();
          if (isMounted) {
            const count = json.metrics?.totalWarehouses ?? (json.data?.length || 0);
            setAutoCode(`WH${String(count + 1).padStart(3, "0")}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/warehouses");
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
    setAddress("");
    setCity("");
    setState("");
    setCountry("India");
    setPincode("");
    setContactPhone("");
    setStatus("ACTIVE");
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage warehouses.");
      }
      return;
    }

    if (!name.trim()) {
      setErrors({ name: "Warehouse name is required." });
      toast.error("Validation Error", "Warehouse name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: autoCode.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || "India",
      pincode: pincode.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      isActive: status === "ACTIVE",
    };

    setIsSubmitting(true);
    try {
      const url = isEditMode
        ? `/api/admin/warehouses/${editId}`
        : "/api/admin/warehouses";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save warehouse");
      }

      toast.success(
        isEditMode ? "Warehouse Updated" : "Warehouse Created",
        `Warehouse "${name}" has been successfully saved.`
      );

      router.push("/warehouses");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving warehouse";
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
            href="/warehouses"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Warehouses (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Warehouse" : "Create Warehouse"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure warehouse facility, storage boundaries, and logistics routing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/warehouses"
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
                    Warehouse Identification
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Facility Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Facility Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Bengaluru Central Depot"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
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
                    The formal logistics facility or distribution hub identifier.
                  </p>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Operational Status <span className="text-rose-500">*</span>
                  </label>
                  <SelectInput
                    options={[
                      { value: "ACTIVE", label: "Active (Accepts Dispatches & Stocks)" },
                      { value: "INACTIVE", label: "Inactive (Closed / Suspended)" },
                    ]}
                    value={status}
                    disabled={isSubmitting}
                    placeholder="Select status..."
                    clearable={false}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  />
                  <p className="text-[11px] text-slate-400">
                    Inactive warehouses cannot accept new purchase orders or stock transfers.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02: Physical Location & Logistics */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Physical Location & Dispatch Details
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 2</span>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Street Address / Industrial Plot
                </label>
                <textarea
                  rows={2}
                  disabled={isSubmitting}
                  placeholder="Plot 42, Electronic City Phase 1..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={cn(
                    "w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y",
                    isSubmitting && "opacity-60 cursor-not-allowed"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    State / Province
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Postal / Pincode
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    placeholder="560100"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Dispatch Phone / Hotline
                  </label>
                  <input
                    type="tel"
                    disabled={isSubmitting}
                    placeholder="+91 80 2345 6789"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
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
                  onClick={() => router.push("/warehouses")}
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
                {isEditMode ? "Save Warehouse" : "Create Warehouse"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: 35% Live Preview & Guidelines */}
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
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {name.trim() || "Untitled Warehouse"}
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

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                {(city || state || pincode) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{[city, state, pincode].filter(Boolean).join(", ")}</span>
                  </p>
                )}
                {contactPhone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{contactPhone}</span>
                  </p>
                )}
                {address && (
                  <p className="text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-2 mt-1">
                    {address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Governance Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Warehouse Governance
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Facility codes are unique identifiers (e.g. *WH001) used across stock ledgers and dispatch dockets.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Each stock movement, bin allocation, and inventory transaction is tied to a specific warehouse facility.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Inactive warehouses cannot receive new purchase orders, stock transfers, or fulfillment shipments.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WarehouseFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading warehouse editor...
        </div>
      }
    >
      <WarehouseFormContent />
    </Suspense>
  );
}
