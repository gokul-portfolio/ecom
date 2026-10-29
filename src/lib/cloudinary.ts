import { v2 as cloudinary } from "cloudinary";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Ensures Cloudinary is properly configured with live environment variables
 */
export function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error(
      "Missing Cloudinary credentials. Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env"
    );
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return cloudinary;
}

// Initial configuration
try {
  configureCloudinary();
} catch {
  // Gracefully ignored during initial static evaluation if envs are not yet injected
}

/**
 * Uploads a buffer directly to Cloudinary CDN
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = "ecommerce/store_branding",
  options?: {
    resourceType?: "image" | "auto" | "raw";
    publicId?: string;
  }
): Promise<CloudinaryUploadResult> {
  const client = configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        resource_type: options?.resourceType || "auto",
        public_id: options?.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error("[Cloudinary] Upload failed:", error);
          reject(new Error(error?.message || "Cloudinary upload failed"));
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Cleanly destroys/removes an existing asset from Cloudinary CDN by its public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId || publicId.startsWith("dev_fallback_") || publicId.startsWith("fallback_")) {
    return true;
  }

  try {
    const client = configureCloudinary();
    const res = await client.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (error) {
    console.warn("[Cloudinary] Failed to delete asset:", publicId, error);
    return false;
  }
}

export default cloudinary;
