export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  generateBlobUploadSas,
  isAzureStorageConfigured,
} from "@/lib/azure-storage";

// Allowed file types
const ALLOWED_TYPES: Record<string, string[]> = {
  materials: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"],
  assignments: [".pdf", ".doc", ".docx", ".zip", ".jpg", ".jpeg", ".png"],
  avatars: [".jpg", ".jpeg", ".png", ".webp"],
};

// Max file sizes (bytes)
const MAX_SIZES: Record<string, number> = {
  materials: 25 * 1024 * 1024, // 25MB
  assignments: 25 * 1024 * 1024, // 25MB
  avatars: 5 * 1024 * 1024, // 5MB
};

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const { userId, sessionClaims } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload." },
        { status: 401 }
      );
    }

    // Check if Azure is configured
    if (!isAzureStorageConfigured()) {
      return NextResponse.json(
        { error: "Azure Blob Storage is not configured", useLocal: true },
        { status: 503 }
      );
    }

    // 2. Parse request JSON
    const body = await request.json();
    const { fileName, fileSize, fileType, category } = body;

    if (!fileName || !category) {
      return NextResponse.json(
        { error: "fileName and category are required" },
        { status: 400 }
      );
    }

    if (!["materials", "assignments", "avatars"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be 'materials', 'assignments', or 'avatars'" },
        { status: 400 }
      );
    }

    // Validate size limit
    const maxSize = MAX_SIZES[category] || 25 * 1024 * 1024;
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = "." + (fileName.split(".").pop()?.toLowerCase() || "");
    if (!ALLOWED_TYPES[category].includes(ext)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES[category].join(", ")}` },
        { status: 400 }
      );
    }

    const orgId =
      (sessionClaims?.metadata as { organizationId?: string })?.organizationId ||
      "default";

    // 3. Generate write SAS URL
    const { uploadUrl, blobPath, filePath, containerName } =
      await generateBlobUploadSas({
        fileName,
        category,
        orgId,
        contentType: fileType,
      });

    return NextResponse.json({
      success: true,
      uploadUrl,
      blobPath,
      filePath,
      containerName,
    });
  } catch (error: any) {
    console.error("Azure SAS generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload SAS token" },
      { status: 500 }
    );
  }
}
