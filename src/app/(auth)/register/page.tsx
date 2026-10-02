"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { FormField, TextInput, PasswordInput } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { User, Mail, Building, ArrowRight, Crown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { settings } = useStoreSettings();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [storeOrDepartment, setStoreOrDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic branding: ONLY display company name & logo if the store has completed onboarding in the database
  const hasOnboardedStore = Boolean(settings?.isOnboarded && settings?.companyName);
  const brandName = hasOnboardedStore ? settings?.companyName : null;
  const brandLogo = hasOnboardedStore ? settings?.logoUrl : null;
  const brandTagline = hasOnboardedStore ? settings?.tagline : null;

  const validate = () => {
    const errs: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      errs.fullName = "Full name is required";
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      errs.email = "Business email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      errs.email = "Please enter a valid email address (e.g. name@company.com)";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // Validate frontend inputs and display inline errors directly below components
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate account registration
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/admin-login?registered=true");
    } catch {
      setErrorMsg("An error occurred during account creation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-slate-100 overflow-hidden">
      {/* Scenic Clouds Sky Wallpaper */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/sky-clouds-bg.jpg"
          alt="Sky with soft clouds"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-sky-200/20 backdrop-blur-[1px]" />
      </div>

      {/* Main Split Card: Left Image + Right Form */}
      <div className="relative z-10 w-full max-w-[1020px] bg-white rounded-[28px] shadow-[0_25px_70px_-15px_rgba(15,23,42,0.22)] border border-white/80 overflow-hidden transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[580px]">
          
          {/* Left Column: Full-Cover Edge-to-Edge E-Commerce Grand Opening Visual */}
          <div className="lg:col-span-5 relative w-full min-h-[300px] lg:min-h-full h-full overflow-hidden group">
            <Image
              src="/images/ecommerce-register-visual.jpg"
              alt="E-Commerce Launch Portal"
              fill
              priority
              className="object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
            />

            {/* Gradient shadow for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Inspirational E-Commerce Typography Overlay */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white select-none pointer-events-none">
              <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-amber-400 mb-1">
                Storefront Portal Access
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-[1.05] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                LAUNCH.
                <br />
                EXPAND. LEAD.
              </h2>
            </div>
          </div>

          {/* Right Column: Clean Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {/* Dynamic Store Brand: ONLY visible after onboarding is completed in backend */}
            {hasOnboardedStore && brandName && (
              <div className="flex flex-col items-center justify-center text-center mb-4 animate-in fade-in duration-300">
                <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-md mb-2 overflow-hidden border border-slate-800">
                  {brandLogo ? (
                    <img
                      src={brandLogo}
                      alt={brandName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Crown className="w-5 h-5 fill-amber-400 text-amber-400 select-none" />
                  )}
                </div>
                <span className="text-[12px] font-black tracking-widest text-slate-800 uppercase">
                  {brandName}
                </span>
                {brandTagline && (
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {brandTagline}
                  </span>
                )}
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="text-center mb-5">
              <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 uppercase">
                CREATE ACCOUNT
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Register your administrator or staff credentials for the commerce portal
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-4">
                <Alert variant="danger" title="Registration Failed">
                  {errorMsg}
                </Alert>
              </div>
            )}

            {/* Registration Form with inline error messages directly below components */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <FormField label="Full Name" required error={fieldErrors.fullName}>
                <TextInput
                  error={Boolean(fieldErrors.fullName)}
                  placeholder="e.g. Vikramaditya Sharma"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }}
                  leftIcon={<User className="w-4 h-4 text-slate-400" />}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Business Email" required error={fieldErrors.email}>
                  <TextInput
                    type="email"
                    error={Boolean(fieldErrors.email)}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                </FormField>

                <FormField label="Department / Brand">
                  <TextInput
                    placeholder="e.g. Operations"
                    value={storeOrDepartment}
                    onChange={(e) => setStoreOrDepartment(e.target.value)}
                    leftIcon={<Building className="w-4 h-4 text-slate-400" />}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Password" required error={fieldErrors.password}>
                  <PasswordInput
                    error={Boolean(fieldErrors.password)}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                  />
                </FormField>

                <FormField label="Confirm Password" required error={fieldErrors.confirmPassword}>
                  <PasswordInput
                    error={Boolean(fieldErrors.confirmPassword)}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                  />
                </FormField>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>

            {/* Existing Account Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                href="/admin-login"
                className="font-bold text-slate-900 hover:underline cursor-pointer ml-1"
              >
                Sign in
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
