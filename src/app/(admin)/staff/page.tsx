import React from "react";
import { prisma } from "@/lib/prisma";
import { StaffClient, StaffRecord } from "./StaffClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Staff & Employee Directory | Admin",
  description: "Enterprise directory for personnel management, payroll structures, shift schedules, and access governance.",
};

export default async function StaffPage() {
  let initialData: StaffRecord[] = [];
  let totalItems = 0;
  let totalPages = 1;
  let metrics = {
    totalHeadcount: 0,
    activeHeadcount: 0,
    monthlyPayrollVolume: 0,
  };

  let departmentsList: { id: string; name: string }[] = [];
  let rolesList: { id: string; name: string }[] = [];
  let shiftsList: { id: string; name: string }[] = [];

  try {
    const [staffRecords, count, aggregate, depts, roles, shifts] = await Promise.all([
      prisma.staff.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
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
      prisma.staff.count(),
      prisma.staff.aggregate({
        _sum: { monthlyGrossSalary: true },
        where: { status: "ACTIVE" },
      }),
      prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.role.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.shift.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    totalItems = count;
    totalPages = Math.ceil(count / 10) || 1;
    departmentsList = depts;
    rolesList = roles;
    shiftsList = shifts;

    metrics = {
      totalHeadcount: count,
      activeHeadcount: await prisma.staff.count({ where: { status: "ACTIVE" } }),
      monthlyPayrollVolume: aggregate._sum.monthlyGrossSalary || 0,
    };

    initialData = staffRecords.map((s) => ({
      ...s,
      joiningDate: s.joiningDate ? s.joiningDate.toISOString() : null,
      contractEndDate: s.contractEndDate ? s.contractEndDate.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to prefetch staff SSR data:", err);
  }

  return (
    <StaffClient
      initialData={initialData}
      initialPagination={{
        totalItems,
        totalPages,
        currentPage: 1,
        pageSize: 10,
      }}
      initialMetrics={metrics}
      departmentsList={departmentsList}
      rolesList={rolesList}
      shiftsList={shiftsList}
    />
  );
}
