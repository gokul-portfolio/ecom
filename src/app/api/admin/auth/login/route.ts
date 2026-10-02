import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, getAdminCookieOptions } from "@/lib/auth/security";
import { signAdminToken } from "@/lib/auth/jwt";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find admin user with optional department and role (case-insensitive)
    const admin = await prisma.adminUser.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
      include: {
        department: true,
        role: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify email and password." },
        { status: 401 }
      );
    }

    // Check account status
    if (admin.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This staff account has been suspended. Contact an administrator." },
        { status: 403 }
      );
    }

    // Check brute-force lockout
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          error: `Account is temporarily locked due to repeated failed logins. Please retry in ${remainingMinutes} minute(s).`,
        },
        { status: 423 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, admin.passwordHash);

    if (!isPasswordValid) {
      const attempts = admin.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (attempts >= 5) {
        // Lock account for 15 minutes after 5 consecutive failures
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error:
            attempts >= 5
              ? "Too many failed attempts. Account locked for 15 minutes."
              : `Invalid credentials. (${5 - attempts} attempts remaining)`,
        },
        { status: 401 }
      );
    }

    // Successful login: Reset failed attempts & record IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      },
    });

    // Record audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "ADMIN_LOGIN_SUCCESS",
        targetEntity: "AdminUser",
        targetId: admin.id,
        ipAddress: clientIp,
        details: { email: admin.email, role: admin.role?.slug || "super_admin" },
      },
    });

    // Extract permissions array (defaults to root access for super admin without seeded role)
    const permissions: string[] = admin.role?.permissions
      ? (Array.isArray(admin.role.permissions) ? (admin.role.permissions as string[]) : [])
      : ["*"];

    // Sign JWT
    const token = await signAdminToken({
      adminId: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      departmentCode: admin.department?.code || "EXECUTIVE",
      departmentName: admin.department?.name || "Executive Administration",
      roleSlug: admin.role?.slug || "super_admin",
      roleName: admin.role?.name || "Super Administrator",
      permissions,
      hasCompletedOnboarding: admin.hasCompletedOnboarding,
    });

    const redirectUrl = admin.hasCompletedOnboarding ? "/dashboard" : "/onboarding";

    // Build response and attach HTTP-Only cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      redirectUrl,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        hasCompletedOnboarding: admin.hasCompletedOnboarding,
        department: admin.department
          ? {
              code: admin.department.code,
              name: admin.department.name,
            }
          : {
              code: "EXECUTIVE",
              name: "Executive Administration",
            },
        role: admin.role
          ? {
              slug: admin.role.slug,
              name: admin.role.name,
              permissions,
            }
          : {
              slug: "super_admin",
              name: "Super Administrator",
              permissions,
            },
      },
    });

    const cookieOptions = getAdminCookieOptions();
    response.cookies.set("admin_token", token, cookieOptions);

    return response;
  } catch (error) {
    console.error("[LOGIN_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
