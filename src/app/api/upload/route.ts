export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Allowed file types
const ALLOWED_TYPES: Record<string, string[]> = {
    materials: [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"],
    assignments: [".pdf", ".doc", ".docx", ".zip", ".jpg", ".jpeg", ".png"],
    avatars: [".jpg", ".jpeg", ".png", ".webp"],
};

// Max file size: 10MB
const MAX_SIZE = 10 * 1024 * 1024;

// Sanitize filename - remove special characters
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/__+/g, "_")
        .substring(0, 100);
}

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const category = formData.get("category") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!category || !["materials", "assignments", "avatars"].includes(category)) {
            return NextResponse.json(
                { error: "Invalid category. Must be 'materials', 'assignments', or 'avatars'" },
                { status: 400 }
            );
        }

        // Avatar-specific max size: 5MB
        const maxSize = category === "avatars" ? 5 * 1024 * 1024 : MAX_SIZE;

        // Check file size
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${category === "avatars" ? "5MB" : "10MB"}` },
                { status: 400 }
            );
        }

        // Check file type
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_TYPES[category].includes(ext)) {
            return NextResponse.json(
                { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES[category].join(", ")}` },
                { status: 400 }
            );
        }

        // Generate safe filename with UUID
        const safeFilename = `${uuidv4()}-${sanitizeFilename(file.name)}`;

        // Create upload directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), "data", "uploads", category);
        await mkdir(uploadDir, { recursive: true });

        // Write file to disk
        const filePath = path.join(uploadDir, safeFilename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Return the file path (relative for API access)
        const fileUrl = `/api/files/${category}/${safeFilename}`;

        return NextResponse.json({
            success: true,
            filePath: fileUrl,
            fileName: file.name,
            fileSize: file.size,
        });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
