"use client";

import React, { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Avatar } from "@/components/common/Avatar";
import { useToast } from "@/components/ui/feedback/Toast";
import {
  User,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Laptop,
  Lock,
} from "lucide-react";

export default function AdminProfilePage() {
  const { admin } = useAdminAuth();
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const displayName = admin?.fullName || "System Super Admin";
  const displayEmail = admin?.email || "admin@gmail.com";
  const displayRole = admin?.role?.name || "Super Administrator";

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to Clipboard", `${label} copied successfully`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* Single Unified Master Card (Consistent with Store Settings) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* 1. Integrated Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Clean Avatar without overlapping cuts or dots */}
            <div className="relative w-14 h-14 rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
              <Avatar name={displayName} size="md" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Account Active
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  {displayRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Structured 3-Column Sequential Flow (Matching Store Settings Alignment) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/90 dark:divide-slate-800 flex-1">
          
          {/* Column 01: ACCOUNT CREDENTIALS */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center">
                  01
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Account Credentials
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Full Name</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    {displayName}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Primary Email Address</span>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {displayEmail}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(displayEmail, "email", "Email")}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Copy Email"
                    >
                      {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Account ID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ADMIN-001
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 02: ROLE & PRIVILEGES */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black flex items-center justify-center">
                  02
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Role & Privileges
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Assigned Role</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    {displayRole}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Permission Scope</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Full System & Store Configuration Access
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Administrative Tier</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Tier 1 Master Admin
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                    Unrestricted
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 03: SECURITY & SESSION */}
          <div className="p-6 lg:p-7 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center">
                  03
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Security & Session
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Authentication Method</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    Encrypted Session Token (JWT)
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Active Session Client</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    Current Browser Session
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Security State</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Standard TLS Secured
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                    Protected
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
