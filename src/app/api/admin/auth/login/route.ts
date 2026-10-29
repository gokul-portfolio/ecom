import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, getAdminCookieOptions } from "@/lib/auth/security";
import { signAdminToken } from "@/lib/auth/jwt";

const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Username or Email is required").optional(),
    email: z.string().trim().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.identifier || data.email), {
    message: "Username or Email is required",
    path: ["identifier"],
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

    const loginIdentifier = (validation.data.identifier || validation.data.email || "").trim();
    const { password } = validation.data;
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // =================================================================
    // 1. LOOKUP ROOT SUPER ADMIN (ISOLATED SUPER ADMIN TABLE)
    // =================================================================
    const superAdmin = await prisma.superAdmin.findFirst({
      where: {
        email: {
          equals: loginIdentifier,
          mode: "insensitive",
        },
      },
    });

    if (superAdmin) {
      if (!superAdmin.isActive) {
        return NextResponse.json(
          { success: false, error: "This super administrator account has been deactivated." },
          { status: 403 }
        );
      }

      if (superAdmin.lockedUntil && superAdmin.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil(
          (superAdmin.lockedUntil.getTime() - Date.now()) / (1000 * 60)
        );
        return NextResponse.json(
          {
            success: false,
            error: `Account is temporarily locked. Please retry in ${remainingMinutes} minute(s).`,
          },
          { status: 423 }
        );
      }

      const isValid = await verifyPassword(password, superAdmin.passwordHash);

      if (!isValid) {
        const attempts = superAdmin.failedLoginAttempts + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

        await prisma.superAdmin.update({
          where: { id: superAdmin.id },
          data: { failedLoginAttempts: attempts, lockedUntil },
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

      // Login success for Super Admin
      await prisma.superAdmin.update({
        where: { id: superAdmin.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: clientIp,
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          actorType: "SUPER_ADMIN",
          superAdminId: superAdmin.id,
          action: "SUPER_ADMIN_LOGIN_SUCCESS",
          targetEntity: "SuperAdmin",
          targetId: superAdmin.id,
          ipAddress: clientIp,
          details: { email: superAdmin.email, role: "super_admin" },
        },
      });

      const token = await signAdminToken({
        adminId: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
        departmentCode: "EXECUTIVE",
        departmentName: "Executive Administration",
        roleSlug: "super_admin",
        roleName: "Super Administrator",
        permissions: ["*"],
        hasCompletedOnboarding: superAdmin.hasCompletedOnboarding,
      });

      const redirectUrl = superAdmin.hasCompletedOnboarding ? "/dashboard" : "/onboarding";

      const response = NextResponse.json({
        success: true,
        message: "Authentication successful",
        redirectUrl,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          fullName: superAdmin.fullName,
          hasCompletedOnboarding: superAdmin.hasCompletedOnboarding,
          isSuperAdmin: true,
          department: {
            code: "EXECUTIVE",
            name: "Executive Administration",
          },
          role: {
            slug: "super_admin",
            name: "Super Administrator",
            permissions: ["*"],
          },
        },
      });

      response.cookies.set("admin_token", token, getAdminCookieOptions());
      return response;
    }

    // =================================================================
    // 2. LOOKUP ORGANIZATIONAL STAFF & EMPLOYEES (STAFF TABLE)
    // =================================================================
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: { equals: loginIdentifier, mode: "insensitive" } },
          { username: { equals: loginIdentifier, mode: "insensitive" } },
          { employeeCode: { equals: loginIdentifier, mode: "insensitive" } },
        ],
      },
      include: {
        department: true,
        role: true,
        shift: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials. Please verify your username/email and password." },
        { status: 401 }
      );
    }

    if (staff.hasLoginAccess === false) {
      return NextResponse.json(
        {
          success: false,
          error: "This staff account does not have administrative portal login access. Please contact your system administrator.",
        },
        { status: 403 }
      );
    }

    if (!staff.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "No login password is configured for this account. Please contact an administrator.",
        },
        { status: 403 }
      );
    }

    if (staff.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This staff account has been suspended. Contact an administrator." },
        { status: 403 }
      );
    }

    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (staff.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          success: false,
          error: `Account is temporarily locked. Please retry in ${remainingMinutes} minute(s).`,
        },
        { status: 423 }
      );
    }

    const isPasswordValid = await verifyPassword(password, staff.passwordHash);

    if (!isPasswordValid) {
      const attempts = staff.failedLoginAttempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.staff.update({
        where: { id: staff.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
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

    // Login success for Staff
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        actorType: "STAFF",
        staffId: staff.id,
        action: "STAFF_LOGIN_SUCCESS",
        targetEntity: "Staff",
        targetId: staff.id,
        ipAddress: clientIp,
        details: { identifier: loginIdentifier, email: staff.email, username: staff.username, role: staff.role?.slug || "staff" },
      },
    });

    const permissions: string[] = staff.role?.permissions
      ? Array.isArray(staff.role.permissions)
        ? (staff.role.permissions as string[])
        : []
      : [];

    const token = await signAdminToken({
      adminId: staff.id,
      email: staff.email || `${staff.username || staff.employeeCode}@portal.local`,
      fullName: staff.fullName,
      departmentCode: staff.department?.code || "GENERAL",
      departmentName: staff.department?.name || "General Department",
      roleSlug: staff.role?.slug || "staff",
      roleName: staff.role?.name || "Staff Member",
      permissions,
      hasCompletedOnboarding: true,
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      redirectUrl: "/dashboard",
      user: {
        id: staff.id,
        email: staff.email,
        username: staff.username,
        hasLoginAccess: staff.hasLoginAccess,
        fullName: staff.fullName,
        hasCompletedOnboarding: true,
        isSuperAdmin: false,
        department: staff.department
          ? {
              code: staff.department.code,
              name: staff.department.name,
            }
          : null,
        role: staff.role
          ? {
              slug: staff.role.slug,
              name: staff.role.name,
              permissions,
            }
          : null,
      },
    });

    response.cookies.set("admin_token", token, getAdminCookieOptions());
    return response;
  } catch (error) {
    console.error("[LOGIN_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
