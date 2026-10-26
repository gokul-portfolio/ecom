import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { shiftSchema } from "@/lib/validations/shift";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "desc" ? "desc" : "asc") as "asc" | "desc";

    // Search filter by shift name or code
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { code: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const allowedSortColumns = ["name", "code", "startTime", "endTime", "gracePeriodMins", "createdAt", "isActive"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "name";

    const [items, totalItems] = await Promise.all([
      prisma.shift.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [validSortBy]: sortOrder },
        include: {
          _count: {
            select: {
              staff: true,
            },
          },
        },
      }),
      prisma.shift.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[SHIFTS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve shifts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = shiftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, startTime, endTime, gracePeriodMins, description, isActive } = validation.data;
    let code = validation.data.code?.trim().toUpperCase();

    // Auto-generate sequential code if omitted: SHF001, SHF002, etc.
    if (!code) {
      const totalCount = await prisma.shift.count();
      let nextNum = totalCount + 1;
      let candidate = `SHF${String(nextNum).padStart(3, "0")}`;
      while (await prisma.shift.findUnique({ where: { code: candidate } })) {
        nextNum++;
        candidate = `SHF${String(nextNum).padStart(3, "0")}`;
      }
      code = candidate;
    } else {
      const existing = await prisma.shift.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Shift code "${code}" already exists` },
          { status: 409 }
        );
      }
    }

    const created = await prisma.shift.create({
      data: {
        code,
        name,
        startTime,
        endTime,
        gracePeriodMins: gracePeriodMins ?? 15,
        description: description || null,
        isActive: isActive ?? true,
      },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    });

    broadcastSocketEvent("shifts:changed", { action: "CREATE", id: created.id });

    return NextResponse.json(
      {
        success: true,
        message: "Shift created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SHIFTS_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create shift" },
      { status: 500 }
    );
  }
}
