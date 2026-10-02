import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, signAdminToken } from "@/lib/auth/jwt";

const onboardingSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  legalName: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  logoPublicId: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  supportEmail: z.string().email("Valid support email is required"),
  supportPhone: z.string().optional().nullable(),
  salesEmail: z.string().email().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  defaultCurrency: z.string().default("INR"),
  currencySymbol: z.string().default("₹"),
  timezone: z.string().default("Asia/Kolkata"),
  streetAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  country: z.string().default("India"),
  instagramUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  twitterUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please login first." },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Upsert singleton StoreSettings record
    const settings = await prisma.storeSettings.upsert({
      where: { id: "default-store-settings" },
      create: {
        id: "default-store-settings",
        companyName: data.companyName,
        legalName: data.legalName,
        tagline: data.tagline,
        logoUrl: data.logoUrl,
        logoPublicId: data.logoPublicId,
        faviconUrl: data.faviconUrl,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        salesEmail: data.salesEmail,
        taxNumber: data.taxNumber,
        panNumber: data.panNumber,
        defaultCurrency: data.defaultCurrency,
        currencySymbol: data.currencySymbol,
        timezone: data.timezone,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        twitterUrl: data.twitterUrl,
        linkedinUrl: data.linkedinUrl,
        isOnboarded: true,
        onboardedAt: new Date(),
      },
      update: {
        companyName: data.companyName,
        legalName: data.legalName,
        tagline: data.tagline,
        logoUrl: data.logoUrl,
        logoPublicId: data.logoPublicId,
        faviconUrl: data.faviconUrl,
        supportEmail: data.supportEmail,
        supportPhone: data.supportPhone,
        salesEmail: data.salesEmail,
        taxNumber: data.taxNumber,
        panNumber: data.panNumber,
        defaultCurrency: data.defaultCurrency,
        currencySymbol: data.currencySymbol,
        timezone: data.timezone,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        instagramUrl: data.instagramUrl,
        facebookUrl: data.facebookUrl,
        twitterUrl: data.twitterUrl,
        linkedinUrl: data.linkedinUrl,
        isOnboarded: true,
        onboardedAt: new Date(),
      },
    });

    // Mark current admin user as onboarded
    await prisma.adminUser.update({
      where: { id: payload.adminId },
      data: { hasCompletedOnboarding: true },
    });

    // Record audit event
    await prisma.adminAuditLog.create({
      data: {
        adminId: payload.adminId,
        action: "STORE_ONBOARDING_COMPLETED",
        targetEntity: "StoreSettings",
        targetId: settings.id,
        details: { companyName: settings.companyName, currency: settings.defaultCurrency },
      },
    });

    const updatedToken = await signAdminToken({
      ...payload,
      hasCompletedOnboarding: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "Store onboarding successfully completed!",
      data: settings,
    });

    response.cookies.set("admin_token", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("[ONBOARDING_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to save onboarding settings" },
      { status: 500 }
    );
  }
}
