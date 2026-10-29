import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/security";

/**
 * Initializes ONLY the Root SuperAdmin in the isolated SuperAdmin table on server boot.
 * Does NOT auto-seed any Departments or Roles — those are managed solely by administrators via the UI.
 */
export async function bootstrapSuperAdmin() {
  try {
    const ROOT_EMAIL = "admin@gmail.com";
    const ROOT_PLAIN_PASSWORD = "Admin@123";

    // 1. Find existing SuperAdmin (case-insensitive check)
    const existingSuperAdmin = await prisma.superAdmin.findFirst({
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

    const superAdminData = {
      email: ROOT_EMAIL,
      passwordHash,
      fullName: "System Super Admin",
      phone: "+91 98765 43210",
      avatarUrl: null,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: "127.0.0.1",
      hasCompletedOnboarding: isStoreOnboarded,
    };

    if (!existingSuperAdmin) {
      const created = await prisma.superAdmin.create({
        data: superAdminData,
      });

      console.log(`========================================================`);
      console.log(`[BOOTSTRAP] Super Admin successfully initialized in isolated SuperAdmin table!`);
      console.log(`  ID:           ${created.id}`);
      console.log(`  Email:        ${created.email}`);
      console.log(`  Password:     ${ROOT_PLAIN_PASSWORD}`);
      console.log(`  Full Name:    ${created.fullName}`);
      console.log(`  Phone:        ${created.phone}`);
      console.log(`  Permissions:  Full Wildcard [*]`);
      console.log(`  Onboarding:   ${isStoreOnboarded ? "Completed (true)" : "Pending (false - First-time login required)"}`);
      console.log(`========================================================`);
    } else {
      await prisma.superAdmin.update({
        where: { id: existingSuperAdmin.id },
        data: {
          hasCompletedOnboarding: isStoreOnboarded,
        },
      });
    }
  } catch (error) {
    console.error("[BOOTSTRAP] Error during Super Admin initialization:", error);
  }
}
