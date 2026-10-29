import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { staffUpdateSchema } from "@/lib/validations/staff";
import { hashPassword } from "@/lib/auth/security";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true, slug: true, isSystem: true, permissions: true } },
        shift: { select: { id: true, name: true, code: true, startTime: true, endTime: true, gracePeriodMins: true } },
        reportingManager: { select: { id: true, fullName: true, employeeCode: true, designation: true } },
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 404 }
      );
    }

    // Omit passwordHash from client response
    const { passwordHash, ...sanitized } = staff;

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    console.error("[STAFF_DETAIL_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve staff details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.staff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 404 }
      );
    }

    const validation = staffUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check duplicate email if changed
    if (data.email && data.email.toLowerCase() !== (existing.email || "").toLowerCase()) {
      const emailClash = await prisma.staff.findFirst({
        where: {
          email: data.email.toLowerCase(),
          id: { not: id },
        },
      });
      if (emailClash) {
        return NextResponse.json(
          { success: false, error: `Email address "${data.email}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Check duplicate employee code if changed
    if (data.employeeCode && data.employeeCode !== existing.employeeCode) {
      const codeClash = await prisma.staff.findUnique({
        where: { employeeCode: data.employeeCode },
      });
      if (codeClash) {
        return NextResponse.json(
          { success: false, error: `Employee code "${data.employeeCode}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Check duplicate username if changed
    if (data.username && data.username.toLowerCase() !== (existing.username || "").toLowerCase()) {
      const usernameClash = await prisma.staff.findFirst({
        where: {
          username: data.username.toLowerCase(),
          id: { not: id },
        },
      });
      if (usernameClash) {
        return NextResponse.json(
          { success: false, error: `Login username "${data.username}" is already assigned to another staff member.` },
          { status: 409 }
        );
      }
    }

    // Optional password update
    const updatePayload: any = { ...data };
    if (data.password && data.password.trim()) {
      updatePayload.passwordHash = await hashPassword(data.password.trim());
    }
    delete updatePayload.password;

    if (data.username !== undefined) {
      updatePayload.username = data.username ? data.username.toLowerCase() : null;
    }

    if (data.hasLoginAccess !== undefined) {
      updatePayload.hasLoginAccess = Boolean(data.hasLoginAccess);
    }

    if (data.email !== undefined) {
      updatePayload.email = data.email ? data.email.toLowerCase() : null;
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: updatePayload,
      select: {
        id: true,
        employeeCode: true,
        username: true,
        hasLoginAccess: true,
        fullName: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    // Real-time synchronization broadcast
    broadcastSocketEvent("staff:changed", { action: "UPDATE", id: updated.id });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[STAFF_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update staff record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.staff.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Staff record not found" },
        { status: 404 }
      );
    }

    // Delete related sessions and logs before removing staff
    await prisma.$transaction([
      prisma.adminSession.deleteMany({ where: { staffId: id } }),
      prisma.adminAuditLog.deleteMany({ where: { staffId: id } }),
      prisma.staff.updateMany({
        where: { reportingManagerId: id },
        data: { reportingManagerId: null },
      }),
      prisma.staff.delete({ where: { id } }),
    ]);

    // Real-time zero-click synchronization
    broadcastSocketEvent("staff:changed", { action: "DELETE", id });

    return NextResponse.json({
      success: true,
      message: `Staff member "${existing.fullName}" has been permanently removed.`,
    });
  } catch (error) {
    console.error("[STAFF_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
