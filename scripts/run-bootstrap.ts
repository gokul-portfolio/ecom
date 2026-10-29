import { bootstrapSuperAdmin } from "../src/server/bootstrap";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Checking bootstrap state...");
  await bootstrapSuperAdmin();

  // Inspect database
  const superAdminCount = await prisma.superAdmin.count();
  const superAdmins = await prisma.superAdmin.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      hasCompletedOnboarding: true,
    },
  });

  const staffCount = await prisma.staff.count();
  const deptCount = await prisma.department.count();
  const roleCount = await prisma.role.count();

  console.log("\n--- Verification Summary ---");
  console.log(`SuperAdmins in DB (${superAdminCount}):`, superAdmins);
  console.log(`Staff in DB: ${staffCount}`);
  console.log(`Departments in DB: ${deptCount}`);
  console.log(`Roles in DB: ${roleCount}`);
  console.log("----------------------------\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Bootstrap execution failed:", err);
  process.exit(1);
});
