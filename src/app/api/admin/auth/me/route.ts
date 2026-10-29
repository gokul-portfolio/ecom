import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    // 1. Check SuperAdmin table
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: payload.adminId },
    });

    if (superAdmin) {
      if (!superAdmin.isActive) {
        return NextResponse.json(
          { success: false, error: "Super admin account deactivated" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          fullName: superAdmin.fullName,
          phone: superAdmin.phone,
          avatarUrl: superAdmin.avatarUrl,
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
    }

    // 2. Check Staff table
    const staff = await prisma.staff.findUnique({
      where: { id: payload.adminId },
      include: {
        department: true,
        role: true,
        shift: true,
      },
    });

    if (!staff || staff.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Staff account not found or suspended" },
        { status: 403 }
      );
    }

    const permissions: string[] = staff.role?.permissions
      ? Array.isArray(staff.role.permissions)
        ? (staff.role.permissions as string[])
        : []
      : [];

    return NextResponse.json({
      success: true,
      user: {
        id: staff.id,
        email: staff.email,
        fullName: staff.fullName,
        phone: staff.phone,
        avatarUrl: staff.avatarUrl,
        hasCompletedOnboarding: true,
        isSuperAdmin: false,
        department: staff.department
          ? {
              code: staff.department.code,
              name: staff.department.name,
            }
          : {
              code: "GENERAL",
              name: "General Staff",
            },
        role: staff.role
          ? {
              slug: staff.role.slug,
              name: staff.role.name,
              permissions,
            }
          : {
              slug: "staff",
              name: "Staff Member",
              permissions,
            },
      },
    });
  } catch (error) {
    console.error("[ME_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve authentication profile" },
      { status: 500 }
    );
  }
}
