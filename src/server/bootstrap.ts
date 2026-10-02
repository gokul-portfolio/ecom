import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/security";

/**
 * Initializes Department, Role, and Root Super Admin on server boot.
 * Populates all fields of AdminUser (except image/avatarUrl as requested).
 */
export async function bootstrapSuperAdmin() {
  try {
    const ROOT_EMAIL = "admin@gmail.com";
    const ROOT_PLAIN_PASSWORD = "Admin@123";

    // 1. Ensure Default Department exists
    const executiveDept = await prisma.department.upsert({
      where: { code: "EXECUTIVE" },
      update: {
        name: "Executive Management",
        description: "Executive administration and platform operations",
        isActive: true,
      },
      create: {
        code: "EXECUTIVE",
        name: "Executive Management",
        description: "Executive administration and platform operations",
        isActive: true,
      },
    });

    // 2. Ensure Default Super Admin Role exists
    const superAdminRole = await prisma.role.upsert({
      where: { slug: "super_admin" },
      update: {
        name: "Super Administrator",
        description: "Full unrestricted platform administrator access",
        departmentId: executiveDept.id,
        isSystem: true,
        permissions: ["*"],
      },
      create: {
        slug: "super_admin",
        name: "Super Administrator",
        description: "Full unrestricted platform administrator access",
        departmentId: executiveDept.id,
        isSystem: true,
        permissions: ["*"],
      },
    });

    // 3. Find existing admin (case-insensitive check)
    const existingAdmin = await prisma.adminUser.findFirst({
      where: {
        email: {
          equals: ROOT_EMAIL,
          mode: "insensitive",
        },
      },
    });

    const passwordHash = await hashPassword(ROOT_PLAIN_PASSWORD);

    // Verify if store settings have actually been onboarded by the user
    const storeSettings = await prisma.storeSettings.findFirst();
    const isStoreOnboarded = !!(storeSettings && storeSettings.isOnboarded);

    // Full AdminUser data payload (avatarUrl excluded as requested)
    const adminData = {
      email: ROOT_EMAIL,
      passwordHash,
      fullName: "System Super Admin",
      phone: "+91 98765 43210",
      avatarUrl: null, // Excluded image as requested
      status: "ACTIVE" as const,
      departmentId: executiveDept.id,
      roleId: superAdminRole.id,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: "127.0.0.1",
      hasCompletedOnboarding: isStoreOnboarded,
    };

    if (!existingAdmin) {
      const created = await prisma.adminUser.create({
        data: adminData,
      });

      console.log(`========================================================`);
      console.log(`[BOOTSTRAP] Super Admin successfully initialized with all details!`);
      console.log(`  ID:           ${created.id}`);
      console.log(`  Email:        ${created.email}`);
      console.log(`  Password:     ${ROOT_PLAIN_PASSWORD}`);
      console.log(`  Full Name:    ${created.fullName}`);
      console.log(`  Phone:        ${created.phone}`);
      console.log(`  Avatar:       [Excluded as requested: null]`);
      console.log(`  Department:   ${executiveDept.name} (${executiveDept.code})`);
      console.log(`  Role:         ${superAdminRole.name} (${superAdminRole.slug})`);
      console.log(`  Permissions:  Full Wildcard [*]`);
      console.log(`  Onboarding:   ${isStoreOnboarded ? "Completed (true)" : "Pending (false - First-time login required)"}`);
      console.log(`========================================================`);
    } else {
      const updated = await prisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: adminData,
      });

      console.log(`========================================================`);
      console.log(`[BOOTSTRAP] Existing Admin User updated with all details!`);
      console.log(`  ID:           ${updated.id}`);
      console.log(`  Email:        ${updated.email}`);
      console.log(`  Full Name:    ${updated.fullName}`);
      console.log(`  Phone:        ${updated.phone}`);
      console.log(`  Avatar:       [Excluded as requested: null]`);
      console.log(`  Department:   ${executiveDept.name}`);
      console.log(`  Role:         ${superAdminRole.name}`);
      console.log(`  Onboarding:   ${isStoreOnboarded ? "Completed (true)" : "Pending (false - First-time login required)"}`);
      console.log(`========================================================`);
    }
  } catch (error) {
    console.error("[BOOTSTRAP] Error during Super Admin initialization:", error);
  }
}
