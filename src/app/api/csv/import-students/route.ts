export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import Papa from "papaparse";

type CsvStudentRow = {
    matricNo?: string;
    matric_no?: string;
    username?: string;
    id?: string;
    admission_no?: string;
    name?: string;
    firstName?: string;
    first_name?: string;
    surname?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    sex?: string;
    gender?: string;
    birthday?: string;
    dob?: string;
    birth_date?: string;
    date_of_birth?: string;
    address?: string;
};

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
            const matricNo = (row.matricNo || row.matric_no || row.username || row.id || row.admission_no)?.trim();

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

            // Validate required fields: ONLY matricNo, name, surname
            const name = (row.name || row.firstName || row.first_name)?.trim();
            const surname = (row.surname || row.lastName || row.last_name)?.trim();

            if (!name || !surname) {
                results.errors.push(`${matricNo} — missing name or surname`);
                continue;
            }

            // Optional fields
            const rawSex = (row.sex || row.gender)?.trim().toUpperCase();
            const sex = rawSex === "MALE" || rawSex === "FEMALE" ? (rawSex as "MALE" | "FEMALE") : undefined;

            const birthdayStr = (row.birthday || row.dob || row.birth_date || row.date_of_birth)?.trim();
            let parsedBirthday: Date | undefined = undefined;
            if (birthdayStr) {
                const parsedDate = new Date(birthdayStr);
                if (!isNaN(parsedDate.getTime())) {
                    parsedBirthday = parsedDate;
                }
            }

            const email = row.email?.trim() || null;
            const phone = row.phone?.trim() || null;
            const address = row.address?.trim() || null;

            // Sanitize username and email for Clerk
            const formattedMatric = matricNo.toLowerCase().replace(/[\/\\]/g, "-").replace(/[^a-z0-9_-]/g, "");
            const clerkUsername = matricNo.toLowerCase().replace(/[^a-z0-9_.]/g, "_");
            const defaultPassword = "CPE@Pass2025!";
            const studentEmail = email || `${formattedMatric}@students.unilorin.edu.ng`;

            try {
                // Create or find Clerk user (Clerk instance requires emailAddress)
                let clerkUserId: string;
                try {
                    const user = await clerkClient().users.createUser({
                        username: clerkUsername,
                        password: defaultPassword,
                        firstName: name,
                        lastName: surname,
                        emailAddress: [studentEmail],
                        publicMetadata: { role: "student", organizationId: organizationId },
                    });
                    clerkUserId = user.id;
                } catch (clerkErr: any) {
                    // If user already exists in Clerk (e.g. from previous run), look them up
                    const byUsername = await clerkClient().users.getUserList({
                        username: [clerkUsername],
                    });
                    if (byUsername.data.length > 0) {
                        clerkUserId = byUsername.data[0].id;
                    } else {
                        const byEmail = await clerkClient().users.getUserList({
                            emailAddress: [studentEmail],
                        });
                        if (byEmail.data.length > 0) {
                            clerkUserId = byEmail.data[0].id;
                        } else {
                            throw clerkErr;
                        }
                    }
                }

                // Create or update Student in database
                await prisma.student.upsert({
                    where: { username: matricNo },
                    update: {
                        id: clerkUserId,
                        name,
                        surname,
                        email: studentEmail,
                        phone: phone,
                        address: address,
                        sex: sex || null,
                        birthday: parsedBirthday || null,
                        gradeId: classWithGrade.gradeId,
                        classId: classId,
                        organizationId: organizationId,
                    },
                    create: {
                        id: clerkUserId,
                        username: matricNo,
                        name,
                        surname,
                        email: studentEmail,
                        phone: phone,
                        address: address,
                        sex: sex || null,
                        birthday: parsedBirthday || null,
                        gradeId: classWithGrade.gradeId,
                        classId: classId,
                        organizationId: organizationId,
                    },
                });

                results.created++;
            } catch (err: any) {
                const message =
                    err?.errors?.[0]?.longMessage ||
                    err?.errors?.[0]?.message ||
                    err?.message ||
                    "Unknown error";
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
