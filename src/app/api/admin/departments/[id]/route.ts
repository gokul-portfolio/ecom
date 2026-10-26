import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { departmentUpdateSchema } from "@/lib/validations/department";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true, roles: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error("[DEPARTMENTS_GET_ONE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = departmentUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.department.update({
      where: { id },
      data: validation.data,
      include: {
        _count: {
          select: { staff: true, roles: true },
        },
      },
    });

    broadcastSocketEvent("departments:changed", { action: "UPDATE", id });

    return NextResponse.json({
      success: true,
      message: "Department updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[DEPARTMENTS_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update department" },
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

    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true, roles: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    // Safety checks: Cannot delete if staff or roles are assigned
    if (existing._count.staff > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department "${existing.name}". There are ${existing._count.staff} active staff member(s) assigned to it. Reassign them first.`,
        },
        { status: 409 }
      );
    }

    if (existing._count.roles > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete department "${existing.name}". There are ${existing._count.roles} role(s) configured under this department. Delete or move those roles first.`,
        },
        { status: 409 }
      );
    }

    await prisma.department.delete({ where: { id } });

    broadcastSocketEvent("departments:changed", { action: "DELETE", id });

    return NextResponse.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("[DEPARTMENTS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
