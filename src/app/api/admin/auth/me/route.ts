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

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      include: {
        department: true,
        role: true,
      },
    });

    if (!admin || admin.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Staff account not found or suspended" },
        { status: 403 }
      );
    }

    const permissions: string[] = admin.role?.permissions
      ? (Array.isArray(admin.role.permissions) ? (admin.role.permissions as string[]) : [])
      : ["*"];

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        phone: admin.phone,
        avatarUrl: admin.avatarUrl,
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
              isSystem: admin.role.isSystem,
              permissions,
            }
          : {
              slug: "super_admin",
              name: "Super Administrator",
              isSystem: true,
              permissions,
            },
      },
    });
  } catch (error) {
    console.error("[ME_API_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
