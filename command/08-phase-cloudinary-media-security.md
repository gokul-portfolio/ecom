# Phase 08: Cloudinary Media Security & Gallery Architecture

---

## 1. Security Architecture & Threat Model

### The Vulnerability of Unsigned Uploads
In naive implementations, developers often:
1. Expose `CLOUDINARY_API_SECRET` in frontend `.env` files, or
2. Allow unsigned presets that allow arbitrary public users to upload malicious binaries or consume storage quotas.

### The Secure Signed Upload Architecture
1. **Zero Secret Exposure**: `CLOUDINARY_API_SECRET` remains exclusively on the Node.js server.
2. **Authenticated Signature Generation**: Before uploading an image, the browser requests a cryptographic signature from `/api/admin/media/sign`:
   $$\text{Signature} = \text{SHA1}(\text{timestamp} + \text{folder} + \text{api\_secret})$$
3. **Direct CDN Ingestion**: The browser uploads directly to `api.cloudinary.com/v1_1/[cloud_name]/image/upload` with the signed parameters, bypassing Next.js server network bottlenecks.
4. **Verified Persistence**: The resulting `secure_url`, `public_id`, `width`, `height`, and `format` are saved into the `ProductMedia` database table.

---

## 2. Backend Signature API Route

```typescript
// src/app/api/admin/media/sign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { configureCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const client = configureCloudinary();
    const body = await request.json();
    const folder = body.folder || "ecommerce/products";
    const timestamp = Math.round(new Date().getTime() / 1000);

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = client.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      success: true,
      data: {
        timestamp,
        signature,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        folder,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
```

---

## 3. UI/UX: Drag-and-Drop Gallery Component

### Features in Step 4 Media:
1. **Direct Upload with Progress Bar**:
   - Shows byte upload progress per image during direct upload to Cloudinary.
   - Max file size: 10MB per image. Formats: JPG, PNG, WebP, AVIF.
2. **Visual Reordering**:
   - Visual drag handles to reorder images with instant visual feedback.
   - `sortOrder` automatically updates (`0, 1, 2, ...`).
3. **Primary Thumbnail Star**:
   - Clickable star badge designates the default thumbnail shown in catalogs and search.
4. **Variant Association Dropdown**:
   - Allows associating a photo with a specific variant (e.g., *Assign to "Ruby Red"*).
5. **Alt Text Editor**:
   - Accessible modal/popover to specify image description for Google Image SEO.
6. **Orphan Cleanup**:
   - Clicking "Remove" calls `deleteFromCloudinary(publicId)` to ensure zero wasted storage.
