export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Papa from "papaparse";

type CsvEnrollRow = {
    matricNo: string;
};

export async function POST(req: NextRequest) { 
    const { default: prisma } = await import("@/lib/prisma");
 
 

    try {
        const { userId, sessionClaims } = auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (sessionClaims?.metadata as { role?: string })?.role;

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const subjectIdStr = formData.get("subjectId") as string | null;

        if (!file || !subjectIdStr) {
            return NextResponse.json(
                { error: "Missing file or subjectId" },
                { status: 400 }
            );
        }

        const subjectId = parseInt(subjectIdStr);
        if (isNaN(subjectId)) {
            return NextResponse.json(
                { error: "Invalid subjectId" },
                { status: 400 }
            );
        }

        // Auth check: must be a teacher of this subject or admin
        if (role !== "admin") {
            const subject = await prisma.subject.findFirst({
                where: {
                    id: subjectId,
                    teachers: { some: { id: userId } },
                },
            });

            if (!subject) {
                return NextResponse.json(
                    { error: "You are not assigned to this course" },
                    { status: 403 }
                );
            }
        }

        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        });

        if (!subject) {
            return NextResponse.json(
                { error: "Course not found" },
                { status: 404 }
            );
        }

        // Parse CSV
        const csvText = await file.text();
        const parsed = Papa.parse<CsvEnrollRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
        });

        // PapaParse often throws "UndetectableDelimiter" if there is only 1 column
        const criticalErrors = parsed.errors.filter(e => e.code !== "UndetectableDelimiter");

        if (criticalErrors.length > 0) {
            return NextResponse.json(
                {
                    error: "CSV parsing errors",
                    details: criticalErrors.map((e) => `Row ${e.row}: ${e.message}`),
                },
                { status: 400 }
            );
        }

        const results = {
            enrolled: 0,
            alreadyEnrolled: [] as string[],
            notFound: [] as string[],
        };

        for (const row of parsed.data) {
            const matricNo = row.matricNo?.trim();

            if (!matricNo) {
                continue;
            }

            // Find student by matric number (username)
            const student = await prisma.student.findUnique({
                where: { username: matricNo },
            });

            if (!student) {
                results.notFound.push(matricNo);
                continue;
            }

            // Check if already enrolled
            const existingEnrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    studentId_subjectId: {
                        studentId: student.id,
                        subjectId: subjectId,
                    },
                },
            });

            if (existingEnrollment) {
                results.alreadyEnrolled.push(matricNo);
                continue;
            }

            try {
                await prisma.courseEnrollment.create({
                    data: {
                        studentId: student.id,
                        subjectId: subjectId,
                    },
                });

                results.enrolled++;
            } catch (err: any) {
                // Unique constraint race condition — treat as already enrolled
                results.alreadyEnrolled.push(matricNo);
            }
        }

        return NextResponse.json(results);
    } catch (err: any) {
        console.error("CSV enrollment error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
