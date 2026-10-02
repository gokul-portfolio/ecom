import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let dbLatency = 0;
  let dbError: string | null = null;

  try {
    const dbStartTime = Date.now();
    // Test PostgreSQL connectivity via lightweight query
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStartTime;
    dbStatus = "connected";
  } catch (error: unknown) {
    dbStatus = "disconnected";
    dbError =
      error instanceof Error
        ? error.message.includes("Can't reach database server")
          ? "Database server unreachable. Please verify PostgreSQL is running."
          : error.message
        : "Unknown database error";
  }

  const memoryUsage = process.memoryUsage();
  const formatMB = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

  const healthData = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    services: {
      api: {
        status: "operational",
        latencyMs: Date.now() - startTime,
      },
      database: {
        provider: "PostgreSQL (Prisma)",
        status: dbStatus,
        latencyMs: dbLatency,
        ...(dbError ? { error: dbError } : {}),
      },
    },
    system: {
      nodeVersion: process.version,
      memory: {
        heapUsed: formatMB(memoryUsage.heapUsed),
        heapTotal: formatMB(memoryUsage.heapTotal),
        rss: formatMB(memoryUsage.rss),
      },
    },
  };

  return NextResponse.json(healthData, {
    status: dbStatus === "connected" ? 200 : 200, // Return 200 so UI can display status details gracefully
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
