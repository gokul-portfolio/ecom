"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/feedback/Toast";
import {
  Store,
  Mail,
  Phone,
  Globe,
  MapPin,
  Clock,
  Coins,
  ShieldCheck,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  FileText,
  Share2,
  Image as ImageIcon,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, isLoading } = useStoreSettings();
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string | null | undefined, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to Clipboard", `${label} copied successfully`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Loading store settings...</p>
        </div>
      </div>
    );
  }

  const socialLinks = [
    { name: "Instagram", url: settings?.instagramUrl, color: "text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800" },
    { name: "Facebook", url: settings?.facebookUrl, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
    { name: "X / Twitter", url: settings?.twitterUrl, color: "text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
    { name: "LinkedIn", url: settings?.linkedinUrl, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800" },
  ];

  const connectedSocials = socialLinks.filter((s) => Boolean(s.url && s.url.trim()));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* Single Unified Master Card (No separate disconnected cards) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* 1. Integrated Executive Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Store Logo with verified badge */}
            <div className="relative w-14 h-14 rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl">
                  {settings?.companyName?.slice(0, 2).toUpperCase() || "ST"}
                </div>
              )}
              {settings?.isOnboarded && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {settings?.companyName || "Store Name"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {settings?.isOnboarded ? "Configured & Live" : "Draft Setup"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <Coins className="w-3 h-3" />
                  {settings?.defaultCurrency || "INR"} ({settings?.currencySymbol || "₹"})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {settings?.tagline || "Curated Multi-Channel E-Commerce Storefront"}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/onboarding">
              <Button
                variant="primary"
                size="md"
                className="px-6 py-2.5 font-bold shadow-sm rounded-md flex items-center gap-2"
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Edit Store Details
              </Button>
            </Link>
          </div>
        </div>

        {/* 2. Structured 3-Column Sequential Flow (Matching Onboarding Grids 01, 02, 03) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/90 dark:divide-slate-800 flex-1">
          
          {/* Column 01: STORE & BRAND IDENTITY */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black flex items-center justify-center">
                  01
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Store & Brand Identity
                </span>
              </div>

              {/* Data Items */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Store Display Name</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {settings?.companyName || "—"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Brand Tagline or Motto</span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    {settings?.tagline || "—"}
                  </p>
                </div>

                {/* Media Assets (Logo & Favicon) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium mb-1.5">Brand Logo (CDN)</span>
                    {settings?.logoUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Not set</span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium mb-1.5">Store Favicon (CDN)</span>
                    {settings?.faviconUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={settings.faviconUrl} alt="Favicon" className="w-8 h-8 rounded object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Uploaded</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Not set</span>
                    )}
                  </div>
                </div>

                {/* Connected Social Channels */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] text-slate-400 block font-medium">Connected Social Channels</span>
                  {connectedSocials.length > 0 ? (
                    <div className="space-y-1.5">
                      {connectedSocials.map((s) => (
                        <a
                          key={s.name}
                          href={s.url!}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${s.color}`}>
                              {s.name}
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono truncate max-w-[170px]">
                              {s.url}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No social channels configured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 02: BUSINESS & CONTACT */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center">
                  02
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Business & Contact
                </span>
              </div>

              {/* Data Items */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Customer Support Email</span>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {settings?.supportEmail || "—"}
                    </p>
                    {settings?.supportEmail && (
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.supportEmail, "supportEmail", "Support Email")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Copy Support Email"
                      >
                        {copiedKey === "supportEmail" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Sales & Inquiries Email</span>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {settings?.salesEmail || "—"}
                    </p>
                    {settings?.salesEmail && (
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.salesEmail, "salesEmail", "Sales Email")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Copy Sales Email"
                      >
                        {copiedKey === "salesEmail" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Support Phone / Hotline</span>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {settings?.supportPhone || "—"}
                    </p>
                    {settings?.supportPhone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.supportPhone, "supportPhone", "Phone Number")}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title="Copy Phone"
                      >
                        {copiedKey === "supportPhone" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Registered Legal Entity Name</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {settings?.legalName || "—"}
                  </p>
                </div>

                {/* Tax ID Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium mb-1">GSTIN / Tax ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {settings?.taxNumber || "—"}
                      </span>
                      {settings?.taxNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.taxNumber, "taxNumber", "GSTIN")}
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {copiedKey === "taxNumber" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium mb-1">PAN / Tax ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                        {settings?.panNumber || "—"}
                      </span>
                      {settings?.panNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(settings.panNumber, "panNumber", "PAN")}
                          className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {copiedKey === "panNumber" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 03: CURRENCY & ADDRESS */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  03
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Currency & Address
                </span>
              </div>

              {/* Data Items */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Operating Currency</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {settings?.defaultCurrency || "INR"} ({settings?.currencySymbol || "₹"})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Store Timezone</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {settings?.timezone || "Asia/Kolkata"}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Street Address</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {settings?.streetAddress || "—"}
                  </p>
                </div>

                {/* Country, State, City, PIN Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Country</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {settings?.country || "India"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">State / Province</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
                      {settings?.state || "Tamil Nadu"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">City</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate block">
                      {settings?.city || "Dindigul"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">PIN / Postal Code</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {settings?.pincode ? `# ${settings.pincode}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
