import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastSocketEvent } from "@/lib/socket-notify";
import { staffSchema } from "@/lib/validations/staff";
import { hashPassword } from "@/lib/auth/security";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";

    // Filter query parameters
    const departmentId = searchParams.get("departmentId") || "";
    const roleId = searchParams.get("roleId") || "";
    const shiftId = searchParams.get("shiftId") || "";
    const status = searchParams.get("status") || "";
    const workMode = searchParams.get("workMode") || "";
    const employmentType = searchParams.get("employmentType") || "";

    // Build Prisma where query
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    }
    if (roleId && roleId !== "all") {
      where.roleId = roleId;
    }
    if (shiftId && shiftId !== "all") {
      where.shiftId = shiftId;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (workMode && workMode !== "all") {
      where.workMode = workMode;
    }
    if (employmentType && employmentType !== "all") {
      where.employmentType = employmentType;
    }

    const allowedSortColumns = ["fullName", "employeeCode", "email", "createdAt", "salary", "monthlyGrossSalary", "joiningDate"];
    const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "createdAt";

    const [items, totalItems, statsSummary] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [validSortBy]: sortOrder },
        select: {
          id: true,
          employeeCode: true,
          username: true,
          hasLoginAccess: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          status: true,
          gender: true,
          bloodGroup: true,
          maritalStatus: true,
          aadhaarNumber: true,
          panNumber: true,
          designation: true,
          employmentType: true,
          workMode: true,
          joiningDate: true,
          probationPeriodDays: true,
          noticePeriodDays: true,
          contractEndDate: true,
          salary: true,
          monthlyGrossSalary: true,
          basicSalary: true,
          hra: true,
          specialAllowance: true,
          taxRegime: true,
          isPfEligible: true,
          pfUanNumber: true,
          isEsiEligible: true,
          esiNumber: true,
          bankName: true,
          bankAccountNo: true,
          bankIfscCode: true,
          bankBranch: true,
          upiId: true,
          annualCasualLeaves: true,
          annualSickLeaves: true,
          annualPaidLeaves: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyRelationship: true,
          currentAddress: true,
          permanentAddress: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: { id: true, name: true, code: true },
          },
          role: {
            select: { id: true, name: true, slug: true, isSystem: true, permissions: true },
          },
          shift: {
            select: { id: true, name: true, code: true, startTime: true, endTime: true, gracePeriodMins: true },
          },
          reportingManager: {
            select: { id: true, fullName: true, employeeCode: true, designation: true },
          },
        },
      }),
      prisma.staff.count({ where }),
      prisma.staff.aggregate({
        _sum: { monthlyGrossSalary: true },
        _count: { id: true },
      }),
    ]);

    const activeCount = await prisma.staff.count({ where: { status: "ACTIVE" } });
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return NextResponse.json({
      success: true,
      data: items,
      metrics: {
        totalHeadcount: statsSummary._count.id || 0,
        activeHeadcount: activeCount,
        monthlyPayrollVolume: statsSummary._sum.monthlyGrossSalary || 0,
      },
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
    console.error("[STAFF_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve staff directory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = staffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      hasLoginAccess = true,
      username,
      password,
      phone,
      avatarUrl,
      status,
      gender,
      dateOfBirth,
      bloodGroup,
      maritalStatus,
      aadhaarNumber,
      panNumber,
      designation,
      departmentId,
      roleId,
      shiftId,
      reportingManagerId,
      employmentType,
      workMode,
      joiningDate,
      probationPeriodDays,
      noticePeriodDays,
      contractEndDate,
      salary,
      monthlyGrossSalary,
      basicSalary,
      hra,
      specialAllowance,
      taxRegime,
      isPfEligible,
      pfUanNumber,
      isEsiEligible,
      esiNumber,
      bankName,
      bankAccountNo,
      bankIfscCode,
      bankBranch,
      upiId,
      annualCasualLeaves,
      annualSickLeaves,
      annualPaidLeaves,
      emergencyContactName,
      emergencyContactPhone,
      emergencyRelationship,
      currentAddress,
      permanentAddress,
    } = validation.data;

    // Check duplicate email if provided
    if (email) {
      const existingEmail = await prisma.staff.findFirst({
        where: { email: email.toLowerCase() },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: `Email address "${email}" is already registered to another staff member.` },
          { status: 409 }
        );
      }
    }

    // Check duplicate username if provided
    if (username) {
      const existingUsername = await prisma.staff.findFirst({
        where: { username: username.toLowerCase() },
      });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: `Login username "${username}" is already assigned to another staff member.` },
          { status: 409 }
        );
      }
    }

    // Auto-generate sequential employee code: EMP001, EMP002, etc. if not provided
    let employeeCode = validation.data.employeeCode?.trim().toUpperCase();
    if (!employeeCode) {
      const totalCount = await prisma.staff.count();
      let nextNum = totalCount + 1;
      let candidate = `EMP${String(nextNum).padStart(3, "0")}`;
      while (await prisma.staff.findUnique({ where: { employeeCode: candidate } })) {
        nextNum++;
        candidate = `EMP${String(nextNum).padStart(3, "0")}`;
      }
      employeeCode = candidate;
    } else {
      const existingCode = await prisma.staff.findUnique({
        where: { employeeCode },
      });
      if (existingCode) {
        return NextResponse.json(
          { success: false, error: `Employee code "${employeeCode}" is already in use.` },
          { status: 409 }
        );
      }
    }

    // Hash password with bcryptjs only if login access is enabled
    let passwordHash: string | null = null;
    if (hasLoginAccess) {
      const rawPassword = password || "Staff@2026";
      passwordHash = await hashPassword(rawPassword);
    }

    const record = await prisma.staff.create({
      data: {
        employeeCode,
        username: username || null,
        hasLoginAccess: Boolean(hasLoginAccess),
        email: email ? email.toLowerCase() : null,
        passwordHash,
        fullName,
        phone,
        avatarUrl,
        status,
        gender,
        dateOfBirth,
        bloodGroup,
        maritalStatus,
        aadhaarNumber,
        panNumber,
        designation,
        departmentId,
        roleId,
        shiftId,
        reportingManagerId,
        employmentType,
        workMode,
        joiningDate: joiningDate || new Date(),
        probationPeriodDays,
        noticePeriodDays,
        contractEndDate,
        salary,
        monthlyGrossSalary,
        basicSalary,
        hra,
        specialAllowance,
        taxRegime,
        isPfEligible,
        pfUanNumber,
        isEsiEligible,
        esiNumber,
        bankName,
        bankAccountNo,
        bankIfscCode,
        bankBranch,
        upiId,
        annualCasualLeaves,
        annualSickLeaves,
        annualPaidLeaves,
        emergencyContactName,
        emergencyContactPhone,
        emergencyRelationship,
        currentAddress,
        permanentAddress,
      },
      select: {
        id: true,
        employeeCode: true,
        username: true,
        hasLoginAccess: true,
        fullName: true,
        email: true,
        status: true,
        designation: true,
        createdAt: true,
      },
    });

    // Real-time zero-click synchronization
    broadcastSocketEvent("staff:changed", { action: "CREATE", id: record.id });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("[STAFF_POST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create staff record" },
      { status: 500 }
    );
  }
}
