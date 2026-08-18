export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Papa from "papaparse";

type CsvTimetableRow = {
    Subject?: string;
    Course?: string;
    Module?: string;
    "Course Code"?: string;
    "Subject Code"?: string;
    Class?: string;
    Level?: string;
    Cohort?: string;
    Group?: string;
    Day?: string;
    day?: string;
    "Start Time"?: string;
    "End Time"?: string;
    startTime?: string;
    endTime?: string;
    Start?: string;
    End?: string;
};

function normalizeTimeString(timeStr: string): string | null {
    if (!timeStr) return null;
    const clean = timeStr.trim();
    // Match HH:mm or H:mm
    const match24 = clean.match(/^(\d{1,2}):(\d{2})(:00)?$/);
    if (match24) {
        const h = match24[1].padStart(2, "0");
        const m = match24[2];
        return `${h}:${m}`;
    }
    // Match 12h format like "8:00 AM" or "02:30 PM"
    const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
        let h = parseInt(match12[1], 10);
        const m = match12[2];
        const ampm = match12[3].toUpperCase();
        if (ampm === "PM" && h < 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return `${h.toString().padStart(2, "0")}:${m}`;
    }
    return clean;
}

export async function POST(req: NextRequest) {
    try {
        const { userId, sessionClaims } = auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (sessionClaims?.metadata as { role?: string })?.role;
        const organizationId = (sessionClaims?.metadata as any)?.organizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No organization context" }, { status: 400 });
        }
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

        // Pre-fetch all active subjects and classes for THIS tenant
        const [allSubjects, allClasses] = await Promise.all([
            prisma.subject.findMany({
                where: { isActive: true, organizationId },
                include: { teachers: true }
            }),
            prisma.class.findMany({
                where: { isActive: true, organizationId }
            })
        ]);

        const validDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
        const dateBase = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

        let rowIdx = 0;
        for (const row of parsed.data) {
            rowIdx++;
            const subjectName = (row.Subject || row.Course || row.Module || row["Course Code"] || row["Subject Code"])?.trim();
            const className = (row.Class || row.Level || row.Cohort || row.Group)?.trim();
            const dayStr = (row.Day || row.day)?.trim().toUpperCase();
            const rawStart = (row["Start Time"] || row.startTime || row.Start || (row as any)["start_time"])?.trim();
            const rawEnd = (row["End Time"] || row.endTime || row.End || (row as any)["end_time"])?.trim();

            if (!subjectName || !className || !dayStr || !rawStart || !rawEnd) {
                results.errors.push(`Row ${rowIdx}: Missing required fields (Course/Subject, Class/Level, Day, Start Time, or End Time)`);
                continue;
            }

            if (!validDays.includes(dayStr)) {
                results.errors.push(`Row ${rowIdx}: Invalid day '${dayStr}' for '${subjectName}'`);
                continue;
            }

            // Find subject by code or title
            const subject = allSubjects.find((s) =>
                s.name.toLowerCase() === subjectName.toLowerCase() ||
                (s.title && s.title.toLowerCase() === subjectName.toLowerCase())
            );
            if (!subject) {
                results.errors.push(`Row ${rowIdx}: Subject/Course '${subjectName}' not found in your organization`);
                continue;
            }

            // Ensure subject has at least one teacher
            if (subject.teachers.length === 0) {
                results.errors.push(`Row ${rowIdx}: Subject/Course '${subjectName}' has no assigned teachers/lecturers`);
                continue;
            }
            const teacherId = subject.teachers[0].id;

            // Find class
            const classItem = allClasses.find((c) => c.name.toLowerCase() === className.toLowerCase());
            if (!classItem) {
                results.errors.push(`Row ${rowIdx}: Class/Level '${className}' not found in your organization`);
                continue;
            }

            const startTimeStr = normalizeTimeString(rawStart);
            const endTimeStr = normalizeTimeString(rawEnd);

            try {
                // Parse times
                const startTime = new Date(`${dateBase}T${startTimeStr}:00`);
                const endTime = new Date(`${dateBase}T${endTimeStr}:00`);

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    results.errors.push(`Row ${rowIdx}: Invalid time format (${rawStart} - ${rawEnd}) for ${subjectName}`);
                    continue;
                }

                if (startTime >= endTime) {
                    results.errors.push(`Row ${rowIdx}: Start time must be earlier than End time for ${subjectName}`);
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
                        organizationId: organizationId,
                    }
                });

                results.created++;
            } catch (err: any) {
                const message = err?.message || "Unknown error";
                results.errors.push(`Row ${rowIdx} (${subjectName} in ${className}): ${message}`);
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
