import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/upload/org-assets
 *
 * Uploads a logo or favicon for an organization.
 * Files are stored in /public/uploads/orgs/<orgId>/<type>.<ext>
 *
 * FormData fields:
 *  - file: File
 *  - orgId: string
 *  - type: "logo" | "favicon"
 */
export async function POST(req: NextRequest) {
  // Auth check: super_admin only
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("orgId") as string | null;
    const assetType = formData.get("type") as "logo" | "favicon" | null;

    if (!file || !orgId || !assetType) {
      return NextResponse.json(
        { error: "Missing file, orgId, or type" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PNG, JPEG, WebP, SVG, ICO" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 2MB" },
        { status: 400 }
      );
    }

    // Determine extension from MIME type
    const extMap: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/x-icon": ".ico",
      "image/vnd.microsoft.icon": ".ico",
    };
    const ext = extMap[file.type] || ".png";

    // Create org upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "orgs", orgId);
    await mkdir(uploadDir, { recursive: true });

    // Write file with a cache-busting timestamp suffix
    const timestamp = Date.now();
    const filename = `${assetType}-${timestamp}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return the public URL
    const publicUrl = `/uploads/orgs/${orgId}/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
