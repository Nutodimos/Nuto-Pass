import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

// MIME types for common file extensions
const MIME_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".zip": "application/zip",
};

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        // Check authentication
        const { userId, sessionClaims } = auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in to access files." },
                { status: 401 }
            );
        }

        // Get user role from session claims
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        // Get path segments
        const pathSegments = params.path;
        if (!pathSegments || pathSegments.length < 2) {
            return NextResponse.json(
                { error: "Invalid file path" },
                { status: 400 }
            );
        }

        // Validate category
        const category = pathSegments[0];
        if (!["materials", "assignments"].includes(category)) {
            return NextResponse.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // Build safe file path - prevent path traversal
        const filename = pathSegments.slice(1).join("/");
        if (filename.includes("..") || filename.includes("~")) {
            return NextResponse.json(
                { error: "Invalid file path" },
                { status: 400 }
            );
        }

        // Full URL path for database lookup
        const fileUrlPath = `/api/files/${category}/${filename}`;
        const physicalPath = path.join(process.cwd(), "data", "uploads", category, filename);

        // ===== ACCESS CONTROL =====
        if (category === "materials") {
            // Find the material in the database
            const material = await prisma.material.findFirst({
                where: { filePath: fileUrlPath },
                include: { class: true },
            });

            if (!material) {
                return NextResponse.json(
                    { error: "Material not found" },
                    { status: 404 }
                );
            }

            // Check access based on role
            if (role === "admin") {
                // Admin can access everything
            } else if (role === "teacher") {
                // Teachers can access their own materials OR general materials
                if (!material.isGeneral && material.teacherId !== userId) {
                    return NextResponse.json(
                        { error: "Access denied. You can only view materials you uploaded." },
                        { status: 403 }
                    );
                }
            } else if (role === "student") {
                // Students can access general materials OR materials for their class
                if (!material.isGeneral) {
                    // Get student's class
                    const student = await prisma.student.findUnique({
                        where: { id: userId },
                        select: { classId: true },
                    });

                    if (!student || material.classId !== student.classId) {
                        return NextResponse.json(
                            { error: "Access denied. This material is not available for your class." },
                            { status: 403 }
                        );
                    }
                }
            } else {
                // Unknown role - deny access
                return NextResponse.json(
                    { error: "Access denied." },
                    { status: 403 }
                );
            }
        }

        // TODO: Add access control for assignments category as needed

        // Check if file exists on disk
        try {
            await stat(physicalPath);
        } catch {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Read file
        const fileBuffer = await readFile(physicalPath);

        // Get MIME type
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        // Return file with proper headers (convert Buffer to Uint8Array for NextResponse)
        return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${path.basename(filename)}"`,
                "Cache-Control": "public, max-age=2592000", // Cache for 30 days
            },
        });


    } catch (error) {
        console.error("File serve error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve file" },
            { status: 500 }
        );
    }
}
