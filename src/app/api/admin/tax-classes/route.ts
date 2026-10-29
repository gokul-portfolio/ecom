import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taxClassSchema } from "@/lib/validations/product";

export async function GET() {
  try {
    let classes = await prisma.taxClass.findMany({
      orderBy: { rate: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Auto-seed standard GST tax slabs if empty
    if (classes.length === 0) {
      await prisma.taxClass.createMany({
        data: [
          { name: "GST 0% (Exempt)", code: "GST_0", rate: 0, isDefault: false, isActive: true },
          { name: "GST 5% (Essential Goods)", code: "GST_5", rate: 5.0, isDefault: false, isActive: true },
          { name: "GST 12% (Standard Lower)", code: "GST_12", rate: 12.0, isDefault: false, isActive: true },
          { name: "GST 18% (Standard Apparel & Electronics)", code: "GST_18", rate: 18.0, isDefault: true, isActive: true },
          { name: "GST 28% (Luxury & Automotive)", code: "GST_28", rate: 28.0, isDefault: false, isActive: true },
        ],
      });

      classes = await prisma.taxClass.findMany({
        orderBy: { rate: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error("[TAX_CLASSES_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve tax classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = taxClassSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, code, rate, hsnCode, isDefault, isActive } = validation.data;

    // Check duplicate code
    const existing = await prisma.taxClass.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Tax class with code "${code}" already exists.` },
        { status: 409 }
      );
    }

    // If setting as default, unmark others
    if (isDefault) {
      await prisma.taxClass.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await prisma.taxClass.create({
      data: {
        name,
        code,
        rate,
        hsnCode: hsnCode || null,
        isDefault,
        isActive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Tax class "${created.name}" created.`,
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[TAX_CLASS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create tax class" },
      { status: 500 }
    );
  }
}
