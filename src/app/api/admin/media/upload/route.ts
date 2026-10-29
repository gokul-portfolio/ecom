import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "ecommerce/store_branding";
    const previousPublicId = formData.get("previousPublicId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided in request" },
        { status: 400 }
      );
    }

    // Validate mime type: allow standard images and favicons (ico, png, svg, webp, jpg, gif)
    const isImage = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".ico");
    if (!isImage) {
      return NextResponse.json(
        { success: false, error: "Only image files (PNG, JPEG, WebP, SVG, ICO) are permitted" },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If replacing an existing image, clean up old asset from Cloudinary
    if (previousPublicId) {
      try {
        await deleteFromCloudinary(previousPublicId);
      } catch (err) {
        console.warn("[Media Upload] Failed to delete previous asset:", previousPublicId, err);
      }
    }

    // Upload to Cloudinary CDN with automatic format handling
    const uploadResult = await uploadToCloudinary(buffer, folder);

    return NextResponse.json({
      success: true,
      message: "Image uploaded to Cloudinary successfully",
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error: any) {
    console.error("[MEDIA_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process image upload to Cloudinary" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "publicId parameter is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteFromCloudinary(publicId);

    return NextResponse.json({
      success: deleted,
      message: deleted ? "Asset deleted from Cloudinary" : "Asset could not be removed or not found",
    });
  } catch (error: any) {
    console.error("[MEDIA_DELETE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete image from Cloudinary" },
      { status: 500 }
    );
  }
}

