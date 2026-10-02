import { bootstrapSuperAdmin } from "../src/server/bootstrap";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting bootstrap process...");
  await bootstrapSuperAdmin();

  // Inspect database
  const adminCount = await prisma.adminUser.count();
  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      departmentId: true,
      roleId: true,
      hasCompletedOnboarding: true,
    },
  });

  const deptCount = await prisma.department.count();
  const roleCount = await prisma.role.count();

  console.log("\n--- Verification Summary ---");
  console.log(`Admin users in DB (${adminCount}):`, admins);
  console.log(`Departments in DB: ${deptCount}`);
  console.log(`Roles in DB: ${roleCount}`);
  console.log("----------------------------\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Bootstrap execution failed:", err);
  process.exit(1);
});
