import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/security";

/**
 * Initializes the root Super Admin on server boot if it doesn't already exist.
 * Department and Role bootstrapping are disabled as requested.
 */
export async function bootstrapSuperAdmin() {
  try {
    const ROOT_EMAIL = "Admin@gmail.com";
    const ROOT_PLAIN_PASSWORD = "Admin@123";

    const existingAdmin = await prisma.adminUser.findFirst({
      where: {
        email: {
          equals: ROOT_EMAIL,
          mode: "insensitive",
        },
      },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword(ROOT_PLAIN_PASSWORD);
      await prisma.adminUser.create({
        data: {
          email: ROOT_EMAIL,
          passwordHash,
          fullName: "System Super Admin",
          status: "ACTIVE",
          hasCompletedOnboarding: false,
        },
      });
      console.log(`========================================================`);
      console.log(`[BOOTSTRAP] Root Super Admin successfully initialized!`);
      console.log(`  Email:    ${ROOT_EMAIL}`);
      console.log(`  Password: ${ROOT_PLAIN_PASSWORD}`);
      console.log(`  Role:     Super Administrator (Full System Access)`);
      console.log(`  Notice:   Departments and roles bootstrapping skipped.`);
      console.log(`========================================================`);
    } else {
      // Ensure password and active status match the user's configuration
      const passwordHash = await hashPassword(ROOT_PLAIN_PASSWORD);
      await prisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: {
          email: ROOT_EMAIL,
          passwordHash,
          status: "ACTIVE",
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      console.log(`[BOOTSTRAP] Admin credentials verified and updated for: ${ROOT_EMAIL}`);
    }
  } catch (error) {
    console.error("[BOOTSTRAP] Error during Super Admin initialization:", error);
  }
}
