import { NextRequest, NextResponse } from "next/server";
import { configureCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const folder = body.folder || "ecommerce/products";
    const timestamp = Math.round(new Date().getTime() / 1000);

    const client = configureCloudinary();
    const api_secret = process.env.CLOUDINARY_API_SECRET!;
    const api_key = process.env.CLOUDINARY_API_KEY!;
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME!;

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = client.utils.api_sign_request(paramsToSign, api_secret);

    return NextResponse.json({
      success: true,
      data: {
        signature,
        timestamp,
        apiKey: api_key,
        cloudName: cloud_name,
        folder,
      },
    });
  } catch (error: any) {
    console.error("[MEDIA_SIGN_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
