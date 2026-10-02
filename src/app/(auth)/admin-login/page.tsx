"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { FormField, TextInput, PasswordInput, Checkbox } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Mail, ArrowRight, Crown } from "lucide-react";
import { useFormKeyboardNavigation } from "@/lib/utils";

// Strict Zod Validation Schema for Login
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (e.g. name@company.com)"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const { login } = useAdminAuth();
  const { settings } = useStoreSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common enterprise keyboard navigation hook from @/lib/utils
  const { formRef, firstInputRef, handleKeyDown: handleFormKeyDown } =
    useFormKeyboardNavigation({
      autoFocusFirstField: true,
      submitOnPasswordEnter: true,
      enableEnterNav: true,
      enableArrowNav: true,
    });

  // Dynamic branding: ONLY display company name & logo if the store has completed onboarding in the database
  const hasOnboardedStore = Boolean(settings?.isOnboarded && settings?.companyName);
  const brandName = hasOnboardedStore ? settings?.companyName : null;
  const brandLogo = hasOnboardedStore ? settings?.logoUrl : null;
  const brandTagline = hasOnboardedStore ? settings?.tagline : null;

  // Frontend Zod Validation Function
  const validateWithZod = (): boolean => {
    const result = loginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const errs: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as "email" | "password";
        if (fieldName && !errs[fieldName]) {
          errs[fieldName] = issue.message;
        }
      });
      setFieldErrors(errs);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Real-time Single Field Zod Validator on Blur
  const handleBlurField = (field: "email" | "password") => {
    const val = field === "email" ? email.trim() : password;
    if (!val) return; // Don't aggressively validate on empty blur before submit

    const fieldSchema = loginSchema.shape[field];
    const res = fieldSchema.safeParse(val);
    if (!res.success) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: res.error.issues[0]?.message,
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // Validate with Zod before communicating with server
    if (!validateWithZod()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email.trim(), password);

      if (res.success) {
        const destination =
          callbackUrl === "/dashboard" && res.redirectUrl
            ? res.redirectUrl
            : callbackUrl;
        router.push(destination);
      } else {
        const serverError = res.error || "Invalid email or password. Please verify credentials.";
        setErrorMsg(serverError);
        setFieldErrors({
          email: "Please check your registered email",
          password: "Or check your password",
        });
      }
    } catch {
      setErrorMsg("A network communication error occurred. Please retry.");
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

      {/* Main Split Card: Full-bleed flush layout */}
      <div className="relative z-10 w-full max-w-[960px] bg-white rounded-[28px] shadow-[0_25px_70px_-15px_rgba(15,23,42,0.22)] border border-white/80 overflow-hidden transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[540px]">
          
          {/* Left Column: Customer Support & E-Commerce Illustration Visual */}
          <div className="lg:col-span-6 relative w-full min-h-[300px] lg:min-h-full h-full overflow-hidden group bg-[#8b6ecb]">
            <Image
              src="/images/login-illustration.jpg"
              alt="E-Commerce Management Visual"
              fill
              priority
              className="object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
            />

            {/* Gradient shadow for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent pointer-events-none" />

            {/* Inspirational E-Commerce Typography Overlay */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white select-none pointer-events-none">
              <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-amber-300 mb-1">
                E-Commerce Management Platform
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-[1.05] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                INNOVATE.
                <br />
                SCALE. SUCCEED.
              </h2>
            </div>
          </div>

          {/* Right Column: Clean Login Form */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {/* Dynamic Store Brand: ONLY visible after onboarding is completed in backend */}
            {hasOnboardedStore && brandName && (
              <div className="flex flex-col items-center justify-center text-center mb-5 animate-in fade-in duration-300">
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
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 uppercase">
                WELCOME BACK
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your email and password to access your account
              </p>
            </div>

            {/* Reusable Alert Component for general server notice */}
            {errorMsg && (
              <div className="mb-4">
                <Alert variant="danger" title="Authentication Error">
                  {errorMsg}
                </Alert>
              </div>
            )}

            {/* Form with Common Keyboard Navigation & Zod Inline Error Messages */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onKeyDown={handleFormKeyDown}
              className="space-y-4"
            >
              
              {/* Reusable FormField + TextInput with Zod error below */}
              <FormField label="Email" required error={fieldErrors.email}>
                <TextInput
                  ref={firstInputRef}
                  autoFocus
                  type="email"
                  size="md"
                  error={Boolean(fieldErrors.email)}
                  placeholder="name@company.com"
                  value={email}
                  onBlur={() => handleBlurField("email")}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />
              </FormField>

              {/* Reusable FormField + PasswordInput with Zod error below */}
              <FormField label="Password" required error={fieldErrors.password}>
                <PasswordInput
                  size="md"
                  error={Boolean(fieldErrors.password)}
                  placeholder="Enter your password"
                  value={password}
                  onBlur={() => handleBlurField("password")}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                />
              </FormField>

              {/* Reusable Checkbox + Forgot Password Link */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <Checkbox
                  label="Remember me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-950 hover:underline transition-colors cursor-pointer"
                >
                  Forgot Password
                </Link>
              </div>

              {/* Reusable Primary Button */}
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
                  {isSubmitting ? "Authenticating..." : "Sign In"}
                </Button>
              </div>
            </form>

            {/* Footer Registration Link */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-slate-900 hover:underline cursor-pointer ml-1"
              >
                Sign up
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-sky-100">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
