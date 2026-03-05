import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Papa from "papaparse";

type CsvTimetableRow = {
    Subject: string;
    Class: string;
    Day: string;
    "Start Time": string;
    "End Time": string;
};

export async function POST(req: NextRequest) {
    try {
        const { userId, sessionClaims } = auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (sessionClaims?.metadata as { role?: string })?.role;
        if (role !== "admin") {
            return NextResponse.json(
                { error: "Only administrators can import timetables." },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Missing file" },
                { status: 400 }
            );
        }

        // Parse CSV
        const csvText = await file.text();
        const parsed = Papa.parse<CsvTimetableRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
        });

        if (parsed.errors.length > 0) {
            return NextResponse.json(
                {
                    error: "CSV parsing errors",
                    details: parsed.errors.map((e) => `Row ${e.row}: ${e.message}`),
                },
                { status: 400 }
            );
        }

        const results = {
            created: 0,
            skipped: [] as string[],
            errors: [] as string[],
        };

        // Pre-fetch all active subjects and classes to minimize DB queries in the loop
        const [allSubjects, allClasses] = await Promise.all([
            prisma.subject.findMany({
                where: { isActive: true },
                include: { teachers: true }
            }),
            prisma.class.findMany({
                where: { isActive: true }
            })
        ]);

        const validDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
        const dateBase = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

        for (const row of parsed.data) {
            const subjectName = row.Subject?.trim();
            const className = row.Class?.trim();
            const dayStr = row.Day?.trim().toUpperCase();
            const startTimeStr = row["Start Time"]?.trim();
            const endTimeStr = row["End Time"]?.trim();

            if (!subjectName || !className || !dayStr || !startTimeStr || !endTimeStr) {
                results.errors.push(`Row missing required fields (Subject, Class, Day, Start Time, or End Time)`);
                continue;
            }

            if (!validDays.includes(dayStr)) {
                results.errors.push(`Invalid day '${dayStr}' for Subject '${subjectName}'`);
                continue;
            }

            // Find subject
            const subject = allSubjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());
            if (!subject) {
                results.errors.push(`Subject '${subjectName}' not found`);
                continue;
            }

            // Ensure subject has at least one teacher
            if (subject.teachers.length === 0) {
                results.errors.push(`Subject '${subjectName}' has no assigned teachers`);
                continue;
            }
            const teacherId = subject.teachers[0].id;

            // Find class
            const classItem = allClasses.find((c) => c.name.toLowerCase() === className.toLowerCase());
            if (!classItem) {
                results.errors.push(`Class '${className}' not found`);
                continue;
            }

            try {
                // Parse times
                const startTime = new Date(`${dateBase}T${startTimeStr}:00`);
                const endTime = new Date(`${dateBase}T${endTimeStr}:00`);

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    results.errors.push(`Invalid time format for ${subjectName} in ${className}`);
                    continue;
                }

                // Create the lesson
                await prisma.lesson.create({
                    data: {
                        name: `${subject.name} - ${classItem.name}`,
                        day: dayStr as any,
                        startTime: startTime,
                        endTime: endTime,
                        subjectId: subject.id,
                        classId: classItem.id,
                        teacherId: teacherId,
                    }
                });

                results.created++;
            } catch (err: any) {
                const message = err?.message || "Unknown error";
                results.errors.push(`Error creating ${subjectName} in ${className}: ${message}`);
            }
        }

        return NextResponse.json(results);
    } catch (err: any) {
        console.error("Timetable CSV import error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
