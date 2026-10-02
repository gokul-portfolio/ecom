"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { useToast } from "@/components/ui/feedback/Toast";
import {
  FormField,
  TextInput,
  SelectInput,
  PhoneInput,
  AddressInput,
  AddressValue,
  ImageUpload,
  ClearButton,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { useFormKeyboardNavigation } from "@/lib/utils";
import {
  ArrowRight,
  Globe,
  Mail,
  FileText,
  Store,
} from "lucide-react";

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR (₹) - Indian Rupee" },
  { value: "USD", label: "USD ($) - US Dollar" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "GBP", label: "GBP (£) - British Pound" },
  { value: "AED", label: "AED (د.إ) - UAE Dirham" },
  { value: "SGD", label: "SGD (S$) - Singapore Dollar" },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
};

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+05:30)" },
  { value: "America/New_York", label: "America/New_York (EST, UTC-05:00)" },
  { value: "Europe/London", label: "Europe/London (GMT, UTC+00:00)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+08:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST, UTC+10:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST, UTC-08:00)" },
];

// Strict Zod Validation Schema matching all StoreSettings fields
const onboardingSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, "Store display name is required")
    .min(2, "Store name must be at least 2 characters"),
  tagline: z.string().trim().optional(),
  supportEmail: z
    .string()
    .trim()
    .min(1, "Customer support email is required")
    .email("Enter a valid support email (e.g. support@company.com)"),
  salesEmail: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Enter a valid sales email address",
    }),
  supportPhone: z.string().trim().optional(),
  legalName: z.string().trim().optional(),
  taxNumber: z.string().trim().optional(),
  panNumber: z.string().trim().optional(),
  defaultCurrency: z
    .string()
    .min(1, "Operating currency is required"),
  timezone: z.string().trim().default("Asia/Kolkata"),
  streetAddress: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d{4,10}$/.test(val.replace(/\s/g, "")), {
      message: "PIN code must be between 4 and 10 digits",
    }),
  country: z.string().trim().default("India"),
  instagramUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL must begin with https://",
    }),
  facebookUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL must begin with https://",
    }),
  twitterUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL must begin with https://",
    }),
  linkedinUrl: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL must begin with https://",
    }),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;
type FieldErrors = Partial<Record<keyof OnboardingFormData, string>>;

export default function SinglePageOnboarding() {
  const router = useRouter();
  const toast = useToast();
  const { settings, refetchSettings } = useStoreSettings();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formAlertError, setFormAlertError] = useState<string | null>(null);

  // Section 1: Store & Brand Identity
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPublicId, setLogoPublicId] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [faviconPublicId, setFaviconPublicId] = useState<string | null>(null);

  // Section 2: Business & Contact Info
  const [legalName, setLegalName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [salesEmail, setSalesEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Section 3: Currency, Timezone & Physical Location
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TN");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("IN");

  // Section 4: Social Channels
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const isEditMode = Boolean(settings?.isOnboarded || settings?.companyName);

  // Populate existing data when editing or when settings are available in database
  useEffect(() => {
    if (settings) {
      if (settings.companyName) setCompanyName(settings.companyName);
      if (settings.tagline) setTagline(settings.tagline);
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
      if (settings.logoPublicId) setLogoPublicId(settings.logoPublicId);
      if (settings.faviconUrl) setFaviconUrl(settings.faviconUrl);
      if ((settings as any).faviconPublicId) setFaviconPublicId((settings as any).faviconPublicId);

      if (settings.legalName) setLegalName(settings.legalName);
      if (settings.supportEmail) setSupportEmail(settings.supportEmail);
      if (settings.salesEmail) setSalesEmail(settings.salesEmail);
      if (settings.supportPhone) setSupportPhone(settings.supportPhone);
      if (settings.taxNumber) setTaxNumber(settings.taxNumber);
      if (settings.panNumber) setPanNumber(settings.panNumber);

      if (settings.defaultCurrency) setDefaultCurrency(settings.defaultCurrency);
      if (settings.timezone) setTimezone(settings.timezone);
      if (settings.streetAddress) setStreetAddress(settings.streetAddress);
      if (settings.city) setCity(settings.city);
      if (settings.state) setState(settings.state);
      if (settings.pincode) setPincode(settings.pincode);
      if (settings.country) setCountry(settings.country);

      if (settings.instagramUrl) setInstagramUrl(settings.instagramUrl);
      if (settings.facebookUrl) setFacebookUrl(settings.facebookUrl);
      if (settings.twitterUrl) setTwitterUrl(settings.twitterUrl);
      if (settings.linkedinUrl) setLinkedinUrl(settings.linkedinUrl);
    }
  }, [settings]);

  // Zod Frontend Validator
  const validateWithZod = (): boolean => {
    const payloadToValidate: OnboardingFormData = {
      companyName: companyName.trim(),
      tagline: tagline.trim() || undefined,
      supportEmail: supportEmail.trim(),
      salesEmail: salesEmail.trim() || undefined,
      supportPhone: supportPhone.trim() || undefined,
      legalName: legalName.trim() || undefined,
      taxNumber: taxNumber.trim() || undefined,
      panNumber: panNumber.trim() || undefined,
      defaultCurrency,
      timezone,
      streetAddress: streetAddress.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      country: country.trim() || "India",
      instagramUrl: instagramUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
    };

    const result = onboardingSchema.safeParse(payloadToValidate);

    if (!result.success) {
      const errs: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const fieldKey = issue.path[0] as keyof OnboardingFormData;
        if (fieldKey && !errs[fieldKey]) {
          errs[fieldKey] = issue.message;
        }
      });
      setFieldErrors(errs);
      setFormAlertError("Please check the required fields highlighted in red below.");
      return false;
    }

    setFieldErrors({});
    setFormAlertError(null);
    return true;
  };

  // Single Field Zod Validator on Blur
  const handleBlurField = (field: keyof OnboardingFormData, value: string) => {
    if (!value && field !== "companyName" && field !== "supportEmail") {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      return;
    }

    const fieldSchema = onboardingSchema.shape[field];
    if (fieldSchema) {
      const res = fieldSchema.safeParse(value.trim() || undefined);
      if (!res.success) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: res.error.issues[0]?.message,
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    }
  };

  // Handle Address Input updates from reusable component
  const handleAddressChange = (val: AddressValue) => {
    setStreetAddress(val.street || "");
    setCity(val.city || "");
    setState(val.state || val.stateName || "TN");
    setPincode(val.pincode || "");
    setCountry(val.country || "IN");

    if (fieldErrors.pincode) {
      setFieldErrors((prev) => ({ ...prev, pincode: undefined }));
    }
  };

  // Reusable Clear / Reset Form Function
  const handleClearForm = () => {
    setCompanyName("");
    setTagline("");
    setLogoUrl(null);
    setLogoPublicId(null);
    setFaviconUrl(null);
    setFaviconPublicId(null);
    setLegalName("");
    setSupportEmail("");
    setSalesEmail("");
    setSupportPhone("");
    setTaxNumber("");
    setPanNumber("");
    setDefaultCurrency("INR");
    setTimezone("Asia/Kolkata");
    setStreetAddress("");
    setCity("");
    setState("TN");
    setPincode("");
    setCountry("IN");
    setInstagramUrl("");
    setFacebookUrl("");
    setTwitterUrl("");
    setLinkedinUrl("");
    setFieldErrors({});
    setFormAlertError(null);
    toast.info("Form Reset", "All form fields have been restored to defaults.");
  };

  // Form Submission
  const handleSaveAndLaunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!validateWithZod()) {
      toast.warning("Validation Required", "Please fill in the required fields to complete setup.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        tagline: tagline.trim() || null,
        legalName: legalName.trim() || null,
        logoUrl: logoUrl || null,
        logoPublicId: logoPublicId || null,
        faviconUrl: faviconUrl || null,
        faviconPublicId: faviconPublicId || null,
        supportEmail: supportEmail.trim(),
        salesEmail: salesEmail.trim() || null,
        supportPhone: supportPhone.trim() || null,
        taxNumber: taxNumber.trim() || null,
        panNumber: panNumber.trim() || null,
        defaultCurrency,
        currencySymbol: CURRENCY_SYMBOLS[defaultCurrency] || "₹",
        timezone,
        streetAddress: streetAddress.trim() || null,
        city: city.trim() || null,
        state: state === "TN" ? "Tamil Nadu" : state.trim() || null,
        pincode: pincode.trim() || null,
        country: country === "IN" ? "India" : country.trim() || "India",
        instagramUrl: instagramUrl.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        twitterUrl: twitterUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
      };

      const res = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to finalize store configuration");
      }

      if (isEditMode) {
        toast.success("Settings Updated", "Store configuration updated successfully!");
        await refetchSettings();
        router.push("/settings");
      } else {
        toast.success("Store Ready!", "Configuration saved successfully! Launching dashboard...");
        await refetchSettings();
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving onboarding";
      toast.error("Submission Failed", msg);
      setFormAlertError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Centralized Enterprise Keyboard Navigation from @/lib/utils
  // Handles: Auto-focus first field, Enter & Arrow keys between fields, and global F2 save
  const { formRef, firstInputRef, handleKeyDown: handleFormKeyDown } = useFormKeyboardNavigation({
    onSave: () => handleSaveAndLaunch(),
    saveKey: "F2",
    enableEnterNav: true,
    enableArrowNav: true,
    autoFocusFirstField: true,
  });

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between p-3 sm:p-5 lg:p-6">
      
      {/* Widescreen Full-Width Master Container */}
      <div className="w-full max-w-[1680px] mx-auto flex flex-col flex-1">
        
        {/* Single Seamless Card Surface (No Nested Cards) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col flex-1 overflow-hidden">
          
          {/* Executive Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  Store Setup & Configuration
                </h1>
                <p className="text-xs text-slate-500">
                  Configure brand assets, communications, operating currency, legal tax identifiers, and official location.
                </p>
              </div>
            </div>
          </div>

          {/* Validation Alert Notice */}
          {formAlertError && (
            <div className="px-6 pt-4">
              <Alert variant="danger" title="Incomplete Requirements">
                {formAlertError}
              </Alert>
            </div>
          )}

          {/* Form */}
          <form
            ref={formRef}
            onSubmit={handleSaveAndLaunch}
            onKeyDown={handleFormKeyDown}
            noValidate
            className="flex-1 flex flex-col justify-between"
          >
            
            {/* 3 Distinctly Separated Responsive Grids with crisp vertical dividers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/90 flex-1">
              
              {/* Grid 1: Store & Brand Identity */}
              <div className="p-6 lg:p-7 space-y-4 flex-1">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-700 text-[10px] font-black flex items-center justify-center">
                    01
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Store & Brand Identity
                  </span>
                </div>

                <FormField label="Store Display Name" required error={fieldErrors.companyName}>
                  <TextInput
                    ref={firstInputRef}
                    autoFocus
                    size="md"
                    rounded="md"
                    error={Boolean(fieldErrors.companyName)}
                    placeholder="e.g. Aura Luxury Fashion"
                    value={companyName}
                    onBlur={() => handleBlurField("companyName", companyName)}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (fieldErrors.companyName) setFieldErrors((prev) => ({ ...prev, companyName: undefined }));
                    }}
                  />
                </FormField>

                <FormField label="Brand Tagline or Motto" error={fieldErrors.tagline}>
                  <TextInput
                    size="md"
                    error={Boolean(fieldErrors.tagline)}
                    placeholder="e.g. Handcrafted Artisanal Heritage"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </FormField>

                {/* Dual Media Uploaders: Logo & Favicon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Brand Logo (CDN)
                    </label>
                    <ImageUpload
                      value={logoUrl}
                      publicId={logoPublicId}
                      onChange={(url, pubId) => {
                        setLogoUrl(url);
                        setLogoPublicId(pubId || null);
                      }}
                      folder="ecommerce/store_branding"
                      placeholderText="Upload Logo"
                      recommendedText="PNG, SVG, JPG (Max 5MB)"
                      size="md"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Store Favicon (CDN)
                    </label>
                    <ImageUpload
                      value={faviconUrl}
                      publicId={faviconPublicId}
                      onChange={(url, pubId) => {
                        setFaviconUrl(url);
                        setFaviconPublicId(pubId || null);
                      }}
                      folder="ecommerce/store_favicons"
                      placeholderText="Upload Favicon"
                      recommendedText="ICO, PNG (32x32)"
                      accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                      size="md"
                    />
                  </div>
                </div>

                {/* Social Channels in 2x2 grid */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Connected Social Channels (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <TextInput
                        size="sm"
                        error={Boolean(fieldErrors.instagramUrl)}
                        placeholder="Instagram URL"
                        value={instagramUrl}
                        onBlur={() => handleBlurField("instagramUrl", instagramUrl)}
                        onChange={(e) => {
                          setInstagramUrl(e.target.value);
                          if (fieldErrors.instagramUrl) setFieldErrors((prev) => ({ ...prev, instagramUrl: undefined }));
                        }}
                        leftIcon={<Globe className="w-3.5 h-3.5 text-slate-400" />}
                      />
                      {fieldErrors.instagramUrl && (
                        <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight">{fieldErrors.instagramUrl}</p>
                      )}
                    </div>

                    <div>
                      <TextInput
                        size="sm"
                        error={Boolean(fieldErrors.facebookUrl)}
                        placeholder="Facebook URL"
                        value={facebookUrl}
                        onBlur={() => handleBlurField("facebookUrl", facebookUrl)}
                        onChange={(e) => {
                          setFacebookUrl(e.target.value);
                          if (fieldErrors.facebookUrl) setFieldErrors((prev) => ({ ...prev, facebookUrl: undefined }));
                        }}
                        leftIcon={<Globe className="w-3.5 h-3.5 text-slate-400" />}
                      />
                      {fieldErrors.facebookUrl && (
                        <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight">{fieldErrors.facebookUrl}</p>
                      )}
                    </div>

                    <div>
                      <TextInput
                        size="sm"
                        error={Boolean(fieldErrors.twitterUrl)}
                        placeholder="X / Twitter"
                        value={twitterUrl}
                        onBlur={() => handleBlurField("twitterUrl", twitterUrl)}
                        onChange={(e) => {
                          setTwitterUrl(e.target.value);
                          if (fieldErrors.twitterUrl) setFieldErrors((prev) => ({ ...prev, twitterUrl: undefined }));
                        }}
                        leftIcon={<Globe className="w-3.5 h-3.5 text-slate-400" />}
                      />
                      {fieldErrors.twitterUrl && (
                        <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight">{fieldErrors.twitterUrl}</p>
                      )}
                    </div>

                    <div>
                      <TextInput
                        size="sm"
                        error={Boolean(fieldErrors.linkedinUrl)}
                        placeholder="LinkedIn URL"
                        value={linkedinUrl}
                        onBlur={() => handleBlurField("linkedinUrl", linkedinUrl)}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          if (fieldErrors.linkedinUrl) setFieldErrors((prev) => ({ ...prev, linkedinUrl: undefined }));
                        }}
                        leftIcon={<Globe className="w-3.5 h-3.5 text-slate-400" />}
                      />
                      {fieldErrors.linkedinUrl && (
                        <p className="text-[10px] text-rose-500 font-medium mt-1 leading-tight">{fieldErrors.linkedinUrl}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Business & Contact */}
              <div className="p-6 lg:p-7 space-y-4 flex-1">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                    02
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Business & Contact
                  </span>
                </div>

                <FormField label="Customer Support Email" required error={fieldErrors.supportEmail}>
                  <TextInput
                    size="md"
                    type="email"
                    error={Boolean(fieldErrors.supportEmail)}
                    placeholder="support@company.com"
                    value={supportEmail}
                    onBlur={() => handleBlurField("supportEmail", supportEmail)}
                    onChange={(e) => {
                      setSupportEmail(e.target.value);
                      if (fieldErrors.supportEmail) setFieldErrors((prev) => ({ ...prev, supportEmail: undefined }));
                    }}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                </FormField>

                <FormField label="Sales & Inquiries Email" error={fieldErrors.salesEmail}>
                  <TextInput
                    size="md"
                    type="email"
                    error={Boolean(fieldErrors.salesEmail)}
                    placeholder="sales@company.com"
                    value={salesEmail}
                    onBlur={() => handleBlurField("salesEmail", salesEmail)}
                    onChange={(e) => {
                      setSalesEmail(e.target.value);
                      if (fieldErrors.salesEmail) setFieldErrors((prev) => ({ ...prev, salesEmail: undefined }));
                    }}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                </FormField>

                {/* Reusable PhoneInput Component */}
                <FormField label="Support Phone / Hotline" error={fieldErrors.supportPhone}>
                  <PhoneInput
                    value={supportPhone}
                    onChange={(val) => {
                      setSupportPhone(val.e164 || val.number);
                      if (fieldErrors.supportPhone) {
                        setFieldErrors((prev) => ({ ...prev, supportPhone: undefined }));
                      }
                    }}
                    error={Boolean(fieldErrors.supportPhone)}
                    defaultCountry="IN"
                    placeholder="Enter phone number"
                  />
                </FormField>

                <FormField label="Registered Legal Entity Name" error={fieldErrors.legalName}>
                  <TextInput
                    size="md"
                    error={Boolean(fieldErrors.legalName)}
                    placeholder="e.g. Aura Retail Enterprises Pvt Ltd"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="GSTIN / Tax ID" error={fieldErrors.taxNumber}>
                    <TextInput
                      size="md"
                      error={Boolean(fieldErrors.taxNumber)}
                      placeholder="33AAAAA0000A1Z5"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value.toUpperCase())}
                      leftIcon={<FileText className="w-3.5 h-3.5 text-slate-400" />}
                    />
                  </FormField>

                  <FormField label="PAN / Tax ID" error={fieldErrors.panNumber}>
                    <TextInput
                      size="md"
                      error={Boolean(fieldErrors.panNumber)}
                      placeholder="AAAAA0000A"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    />
                  </FormField>
                </div>
              </div>

              {/* Grid 3: Currency & Address */}
              <div className="p-6 lg:p-7 space-y-4 flex-1">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 text-[10px] font-black flex items-center justify-center">
                    03
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Currency & Address
                  </span>
                </div>

                {/* Operating Currency: Full width for comfortable reading */}
                <FormField label="Operating Currency" required error={fieldErrors.defaultCurrency}>
                  <SelectInput
                    options={CURRENCY_OPTIONS}
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    placeholder="Select currency"
                    clearable={false}
                  />
                </FormField>

                {/* Store Timezone: Full width prevents truncation of long timezone labels */}
                <FormField label="Store Timezone" required>
                  <SelectInput
                    options={TIMEZONE_OPTIONS}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Select timezone"
                    clearable={false}
                  />
                </FormField>

                {/* Reusable AddressInput Component with Cascading Country, State, City, Street & PIN */}
                <div className="space-y-1">
                  <AddressInput
                    value={{
                      street: streetAddress,
                      city,
                      state: state || "TN",
                      pincode,
                      country: country || "IN",
                    }}
                    onChange={handleAddressChange}
                    showPreview={false}
                    defaultCountry="IN"
                    defaultState="TN"
                  />
                  {fieldErrors.pincode && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {fieldErrors.pincode}
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Action Dock */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <ClearButton
                onClear={handleClearForm}
                firstInputRef={firstInputRef}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-md"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-2.5 font-bold shadow-sm flex items-center justify-center gap-2 rounded-md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Saving Changes..."
                    : "Finalizing Configuration..."
                  : isEditMode
                  ? "Save Changes"
                  : "Complete Setup & Launch Store"}
              </Button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
