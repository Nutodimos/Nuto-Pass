import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stat } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
import path from "path";
import { isAzureStorageConfigured, generateBlobReadSas } from "@/lib/azure-storage";

export const dynamic = "force-dynamic";

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
    ".webp": "image/webp",
    ".zip": "application/zip",
};

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        // 1. Check authentication
        const { userId, sessionClaims } = auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized. Please log in to access files." },
                { status: 401 }
            );
        }

        // 2. Get user role from session claims
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        // 3. Get path segments
        const pathSegments = params.path;
        if (!pathSegments || pathSegments.length < 2) {
            return NextResponse.json(
                { error: "Invalid file path" },
                { status: 400 }
            );
        }

        // Validate category
        const category = pathSegments[0];
        if (!["materials", "assignments", "avatars"].includes(category)) {
            return NextResponse.json(
                { error: "Invalid category" },
                { status: 400 }
            );
        }

        // Prevent path traversal
        const filename = pathSegments.slice(1).join("/");
        if (filename.includes("..") || filename.includes("~")) {
            return NextResponse.json(
                { error: "Invalid file path" },
                { status: 400 }
            );
        }

        // Full URL path matching what's stored in the database
        const fileUrlPath = `/api/files/${category}/${filename}`;

        // ===== RBAC ACCESS CONTROL =====
        if (category === "materials") {
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

            if (role === "admin") {
                // Admin can access all materials
            } else if (role === "teacher") {
                if (!material.isGeneral && material.teacherId !== userId) {
                    return NextResponse.json(
                        { error: "Access denied. You can only view materials you uploaded." },
                        { status: 403 }
                    );
                }
            } else if (role === "student") {
                if (!material.isGeneral) {
                    const student = await prisma.student.findUnique({
                        where: { id: userId },
                        select: { classId: true },
                    });

                    // Check if student is in the class OR enrolled in the subject
                    let hasAccess = student && material.classId === student.classId;
                    if (!hasAccess) {
                        const enrollment = await prisma.courseEnrollment.findFirst({
                            where: { studentId: userId, subjectId: material.subjectId },
                        });
                        hasAccess = !!enrollment;
                    }

                    if (!hasAccess) {
                        return NextResponse.json(
                            { error: "Access denied. This material is not available for your class." },
                            { status: 403 }
                        );
                    }
                }
            } else {
                return NextResponse.json(
                    { error: "Access denied." },
                    { status: 403 }
                );
            }
        } else if (category === "assignments") {
            const submission = await prisma.assignmentSubmission.findFirst({
                where: { submissionUrl: fileUrlPath },
                include: { assignment: { include: { subject: { include: { teachers: { select: { id: true } } } } } } },
            });

            if (!submission) {
                return NextResponse.json({ error: "Submission not found" }, { status: 404 });
            }

            if (role === "admin") {
                // Admin can access everything
            } else if (role === "teacher") {
                const isTeacherOfSubject = submission.assignment.subject.teachers.some(t => t.id === userId);
                if (!isTeacherOfSubject) {
                    return NextResponse.json({ error: "Access denied." }, { status: 403 });
                }
            } else if (role === "student") {
                if (submission.studentId !== userId) {
                    return NextResponse.json({ error: "Access denied." }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: "Access denied." }, { status: 403 });
            }
        }

        // ===== SERVE FILE: AZURE STORAGE OR LOCAL DISK =====

        // 1. Check Azure Blob Storage if configured
        if (isAzureStorageConfigured()) {
            try {
                // If pathSegments is [category, orgId, safeFilename] -> blobPath is "orgId/category/safeFilename"
                // If pathSegments is [category, safeFilename] -> blobPath is "default/category/safeFilename"
                let blobPath = "";
                if (pathSegments.length >= 3) {
                    const orgId = pathSegments[1];
                    const safeName = pathSegments.slice(2).join("/");
                    blobPath = `${orgId}/${category}/${safeName}`;
                } else {
                    blobPath = `default/${category}/${pathSegments[1]}`;
                }

                const downloadName = path.basename(filename);
                const readSasUrl = await generateBlobReadSas({
                    blobPath,
                    expiresInMinutes: 15,
                    downloadName,
                });

                // Redirect to temporary SAS URL (0 Azure App Service bandwidth consumed)
                return NextResponse.redirect(readSasUrl, 307);
            } catch (azureErr) {
                console.warn("Azure SAS read generation failed, checking local disk:", azureErr);
            }
        }

        // 2. Fallback to Local Disk (for local dev or legacy files)
        const physicalPath = path.join(process.cwd(), "data", "uploads", category, filename);

        try {
            await stat(physicalPath);
        } catch {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Stream file from disk to avoid RAM spikes
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const nodeStream = createReadStream(physicalPath);
        const webStream = Readable.toWeb(nodeStream);

        return new NextResponse(webStream as any, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${encodeURIComponent(path.basename(filename))}"`,
                "Cache-Control": "public, max-age=2592000",
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
