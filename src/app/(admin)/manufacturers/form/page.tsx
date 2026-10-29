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
  Factory,
  Layers,
  Save,
  RotateCcw,
  AlertCircle,
  Globe,
  Sparkles,
  Keyboard,
  Flag,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { manufacturerSchema, manufacturerUpdateSchema } from "@/lib/validations/manufacturer";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { SelectInput } from "@/components/ui/form";

function ManufacturerFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const { hasPermission } = useAdminAuth();
  const canWrite =
    hasPermission("manufacturers:write") ||
    hasPermission("catalog:write") ||
    hasPermission("*");

  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [companyName, setCompanyName] = useState("");
  const [autoCode, setAutoCode] = useState("MNF001");
  const [registrationNo, setRegistrationNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
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

  // Keyboard Navigation: Enter moves between inputs
  const { containerRef } = useFormKeyboardNavigation();

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      submitForm();
    },
    onCancel: () => {
      router.push("/manufacturers");
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
          const res = await fetch(`/api/admin/manufacturers/${editId}`);
          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.error || "Failed to load manufacturer details");
          }

          if (isMounted && json.data) {
            const m = json.data;
            setCompanyName(m.companyName || "");
            setAutoCode(m.code || "MNF001");
            setRegistrationNo(m.registrationNo || "");
            setEmail(m.email || "");
            setPhone(m.phone || "");
            setAddress(m.address || "");
            setCountryOfOrigin(m.countryOfOrigin || "India");
            setStatus(m.isActive ? "ACTIVE" : "INACTIVE");
          }
        } else {
          const res = await fetch("/api/admin/manufacturers?limit=1");
          const json = await res.json();
          if (isMounted) {
            const count = json.metrics?.totalManufacturers ?? 0;
            setAutoCode(`MNF${String(count + 1).padStart(3, "0")}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading data";
        if (isEditMode) {
          toast.error("Not Found", msg);
          router.push("/manufacturers");
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
    setCompanyName("");
    setRegistrationNo("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCountryOfOrigin("India");
    setStatus("ACTIVE");
    setErrors({});
    nameInputRef.current?.focus();
  };

  const submitForm = async () => {
    if (isSubmitting || !canWrite) {
      if (!canWrite) {
        toast.error("Permission Denied", "You do not have permission to manage manufacturers.");
      }
      return;
    }

    const trimmedName = companyName.trim();

    const payload = {
      companyName: trimmedName,
      registrationNo: registrationNo.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      countryOfOrigin: countryOfOrigin.trim() || "India",
      isActive: status === "ACTIVE",
    };

    if (isEditMode) {
      const validation = manufacturerUpdateSchema.safeParse(payload);
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
      const validation = manufacturerSchema.safeParse(payload);
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
        ? `/api/admin/manufacturers/${editId}`
        : "/api/admin/manufacturers";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save manufacturer");
      }

      toast.success(
        isEditMode ? "Manufacturer Updated" : "Manufacturer Created",
        `Manufacturer "${trimmedName}" has been successfully saved.`
      );

      router.push("/manufacturers");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving manufacturer";
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
            href="/manufacturers"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Manufacturers (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{isEditMode ? "Edit Manufacturer" : "Create Manufacturer"}</span>
                <span className="font-mono text-base font-semibold text-slate-400 dark:text-slate-500">
                  *{autoCode}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register manufacturing entities, compliance licenses, and factory facilities.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/manufacturers"
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
            {/* Step 01: Legal Identity & Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Legal Corporate Entity
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Company / Entity Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    suppressHydrationWarning
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Apex Industrial Technologies Pvt Ltd"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      clearError("companyName");
                    }}
                    className={cn(
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all",
                      isSubmitting && "opacity-60 cursor-not-allowed",
                      errors.companyName
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    )}
                  />
                  {errors.companyName && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.companyName}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    The legal registered producer printed on trade compliance and invoices.
                  </p>
                </div>

                {/* Registration / CIN */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Registration / CIN / License
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={registrationNo}
                    onChange={(e) => {
                      setRegistrationNo(e.target.value);
                      clearError("registrationNo");
                    }}
                    placeholder="e.g. U74999DL2018PTC333444"
                    className="w-full h-10 px-3 text-xs font-mono font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Statutory business license or corporate identity registration.
                  </p>
                </div>

                {/* Country of Origin */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Manufacturing Country
                  </label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. India, Japan, Germany, USA"
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-[11px] text-slate-400">
                    Primary assembly and fabrication jurisdiction.
                  </p>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Producer Status <span className="text-rose-500">*</span>
                  </label>
                  <SelectInput
                    options={[
                      { value: "ACTIVE", label: "Active (Approved Producer)" },
                      { value: "INACTIVE", label: "Inactive (Archived)" },
                    ]}
                    value={status}
                    disabled={isSubmitting}
                    placeholder="Select status..."
                    clearable={false}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                  />
                  <p className="text-[11px] text-slate-400">
                    Inactive producers cannot be attached to newly created inventory items.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02: Facility & Compliance Contact */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Facility & Compliance Contact
                  </h2>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Step 2 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Compliance Email
                  </label>
                  <input
                    type="email"
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    placeholder="compliance@manufacturer.com"
                    className={cn(
                      "w-full h-10 px-3 text-xs font-medium rounded-xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all",
                      errors.email
                        ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                        : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    )}
                  />
                  {errors.email && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Support Phone / Hotline
                  </label>
                  <input
                    type="tel"
                    disabled={isSubmitting}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError("phone");
                    }}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Registered Factory Address
                </label>
                <textarea
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Industrial Area, Sector 5, Bengaluru, Karnataka - 560001"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y"
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
                  onClick={() => router.push("/manufacturers")}
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
                {isEditMode ? "Save Manufacturer" : "Create Manufacturer"}
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
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {companyName.trim() || "Untitled Manufacturer"}
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

              {registrationNo && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>CIN: {registrationNo}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-slate-400" />
                  {countryOfOrigin || "India"}
                </span>
                {email && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {email}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {address.trim() || "No facility or plant address specified yet."}
              </p>
            </div>
          </div>

          {/* Manufacturer Governance Card */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Manufacturer Governance
              </h3>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Producer codes (<code className="font-mono text-indigo-500 font-bold">*MNF00X</code>) ensure statutory accountability across batch production lots.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Registration numbers and CIN details validate GST and e-way bill compliance.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Deactivated producers automatically freeze new purchase order generation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ManufacturerFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-400">
          Loading manufacturer editor...
        </div>
      }
    >
      <ManufacturerFormContent />
    </Suspense>
  );
}
