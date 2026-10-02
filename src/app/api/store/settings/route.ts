import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.storeSettings.findFirst();

    if (!settings || !settings.isOnboarded) {
      return NextResponse.json({
        success: true,
        data: settings ? { ...settings, isOnboarded: false } : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("[STORE_SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve store settings" },
      { status: 500 }
    );
  }
}
