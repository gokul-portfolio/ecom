"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FormField, TextInput } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const emailTrim = email.trim();
    if (!emailTrim) {
      setEmailError("Email address is required");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setEmailError("Please enter a valid email address (e.g. name@company.com)");
      return;
    }

    setEmailError(null);
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      // Simulate enterprise password reset request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch {
      setErrorMsg("An unexpected error occurred while requesting password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-100 overflow-hidden">
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

      {/* Centered Floating Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-[28px] shadow-[0_25px_70px_-15px_rgba(15,23,42,0.2)] border border-white/80 p-8 sm:p-10 transition-all">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Enter your registered staff email and we will send you a secure verification link to reset your password.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4">
            <Alert variant="danger" title="Reset Request Failed">
              {errorMsg}
            </Alert>
          </div>
        )}

        {/* Success Notice or Form */}
        {isSubmitted ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <p className="font-semibold text-sm">Reset Link Dispatched!</p>
              <p className="text-emerald-700 leading-normal">
                If an account with <strong className="font-mono text-emerald-900">{email}</strong> exists, you will receive password reset instructions shortly.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="md"
              onClick={() => {
                setIsSubmitted(false);
                setEmail("");
              }}
            >
              Send to another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Staff Email Address" required error={emailError || undefined}>
              <TextInput
                type="email"
                required
                error={Boolean(emailError)}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Dispatching..." : "Send Reset Link"}
              </Button>
            </div>
          </form>
        )}

        {/* Back to Login Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/admin-login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
