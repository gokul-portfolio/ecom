import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";

const roleUpdateSchema = z.object({
  name: z.string().min(3, "Role name must be at least 3 characters").optional(),
  departmentId: z.string().uuid().optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(z.string()).min(1, "Select at least one permission").optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = roleUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Protect root super_admin from losing root permission
    if (existing.isSystem && validation.data.permissions && !validation.data.permissions.includes("*")) {
      return NextResponse.json(
        { success: false, error: "Cannot revoke wildcard permissions from root system administrator role." },
        { status: 403 }
      );
    }

    const updated = await prisma.role.update({
      where: { id },
      data: validation.data,
      include: {
        department: true,
        _count: {
          select: { staff: true },
        },
      },
    });

    broadcastSocketEvent("roles:changed", { action: "UPDATE", id });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[ROLES_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Safety checks
    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: "System roles are protected and cannot be deleted." },
        { status: 403 }
      );
    }

    if (existing._count.staff > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role "${existing.name}". There are ${existing._count.staff} active staff member(s) assigned to this role. Reassign them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.role.delete({ where: { id } });

    broadcastSocketEvent("roles:changed", { action: "DELETE", id });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("[ROLES_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
