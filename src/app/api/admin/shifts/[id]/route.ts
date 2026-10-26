import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { shiftUpdateSchema } from "@/lib/validations/shift";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error("[SHIFTS_GET_ONE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shift" },
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
    const validation = shiftUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: validation.data,
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    broadcastSocketEvent("shifts:changed", { action: "UPDATE", id });

    return NextResponse.json({
      success: true,
      message: "Shift updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[SHIFTS_PUT_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update shift" },
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

    const existing = await prisma.shift.findUnique({
      where: { id },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    // Protection: Prevent deleting shift if staff members are currently assigned
    if (existing._count.staff > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete shift "${existing.name}". It is assigned to ${existing._count.staff} staff member(s). Reassign them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.shift.delete({ where: { id } });

    broadcastSocketEvent("shifts:changed", { action: "DELETE", id });

    return NextResponse.json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("[SHIFTS_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
