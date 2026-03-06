export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import Papa from "papaparse";

type CsvStudentRow = {
    matricNo: string;
    name: string;
    surname: string;
    email?: string;
    phone?: string;
    sex: string;
    birthday: string;
    address: string;
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
        const classIdStr = formData.get("classId") as string | null;

        if (!file || !classIdStr) {
            return NextResponse.json(
                { error: "Missing file or classId" },
                { status: 400 }
            );
        }

        const classId = parseInt(classIdStr);
        if (isNaN(classId)) {
            return NextResponse.json(
                { error: "Invalid classId" },
                { status: 400 }
            );
        }

        // Auth check: must be supervisor of this class or admin
        if (role !== "admin") {
            const classItem = await prisma.class.findUnique({
                where: { id: classId },
                select: { supervisorId: true, gradeId: true },
            });

            if (!classItem || classItem.supervisorId !== userId) {
                return NextResponse.json(
                    { error: "You are not the level advisor for this class" },
                    { status: 403 }
                );
            }
        }

        // Get the class with its grade
        const classWithGrade = await prisma.class.findUnique({
            where: { id: classId },
            select: { gradeId: true },
        });

        if (!classWithGrade) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        // Parse CSV
        const csvText = await file.text();
        const parsed = Papa.parse<CsvStudentRow>(csvText, {
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

        for (const row of parsed.data) {
            const matricNo = row.matricNo?.trim();

            if (!matricNo) {
                results.errors.push("Row missing matricNo — skipped");
                continue;
            }

            // Check if student already exists
            const existing = await prisma.student.findUnique({
                where: { username: matricNo },
            });

            if (existing) {
                results.skipped.push(`${matricNo} — already exists`);
                continue;
            }

            // Validate required fields
            const name = row.name?.trim();
            const surname = row.surname?.trim();
            const sex = row.sex?.trim().toUpperCase();
            const birthday = row.birthday?.trim();
            const address = row.address?.trim();

            if (!name || !surname) {
                results.errors.push(`${matricNo} — missing name or surname`);
                continue;
            }

            if (sex !== "MALE" && sex !== "FEMALE") {
                results.errors.push(`${matricNo} — invalid sex (must be MALE or FEMALE)`);
                continue;
            }

            if (!birthday) {
                results.errors.push(`${matricNo} — missing birthday`);
                continue;
            }

            const parsedDate = new Date(birthday);
            if (isNaN(parsedDate.getTime())) {
                results.errors.push(`${matricNo} — invalid birthday format`);
                continue;
            }

            try {
                // Create Clerk user with matric no as username and password
                const user = await clerkClient().users.createUser({
                    username: matricNo,
                    password: matricNo,
                    firstName: name,
                    lastName: surname,
                    publicMetadata: { role: "student" },
                    ...(row.email?.trim() ? { emailAddress: [row.email.trim()] } : {}),
                });

                // Create Student in database
                await prisma.student.create({
                    data: {
                        id: user.id,
                        username: matricNo,
                        name,
                        surname,
                        email: row.email?.trim() || null,
                        phone: row.phone?.trim() || null,
                        address: address || "",
                        sex: sex as "MALE" | "FEMALE",
                        birthday: parsedDate,
                        gradeId: classWithGrade.gradeId,
                        classId: classId,
                    },
                });

                results.created++;
            } catch (err: any) {
                const message =
                    err?.errors?.[0]?.message || err?.message || "Unknown error";
                results.errors.push(`${matricNo} — ${message}`);
            }
        }

        return NextResponse.json(results);
    } catch (err: any) {
        console.error("CSV import error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
