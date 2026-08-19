export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Papa from "papaparse";

type CsvLecturerRow = {
    staffId?: string;
    username?: string;
    staff_id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    first_name?: string;
    surname?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    sex?: string;
    birthday?: string;
    address?: string;
    courses?: string;
    subjects?: string;
    modules?: string;
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

        if (role !== "admin") {
            return NextResponse.json(
                { error: "Only administrators can import teachers/lecturers." },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "Missing CSV file" },
                { status: 400 }
            );
        }

        // Parse CSV
        const csvText = await file.text();
        const parsed = Papa.parse<CsvLecturerRow>(csvText, {
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

        // Pre-fetch all active subjects for this organization for matching
        const allSubjects = await prisma.subject.findMany({
            where: { isActive: true, organizationId },
            select: { id: true, name: true, title: true }
        });

        let rowIdx = 0;
        for (const row of parsed.data) {
            rowIdx++;
            const staffId = (row.staffId || row.username || row.staff_id || row.id)?.trim();
            const name = (row.name || row.firstName || row.first_name)?.trim();
            const surname = (row.surname || row.lastName || row.last_name)?.trim();
            const email = row.email?.trim();
            const phone = row.phone?.trim();
            const rawSex = row.sex?.trim().toUpperCase();
            const sex = rawSex === "MALE" || rawSex === "FEMALE" ? (rawSex as "MALE" | "FEMALE") : undefined;
            const birthdayStr = row.birthday?.trim();
            const address = row.address?.trim();
            const coursesStr = (row.courses || row.subjects || row.modules)?.trim();

            if (!staffId || !name || !surname) {
                results.errors.push(`Row ${rowIdx}: Missing required Staff ID, First Name, or Last Name`);
                continue;
            }

            // Check if lecturer already exists in DB
            const existing = await prisma.teacher.findUnique({
                where: { username: staffId },
            });

            if (existing) {
                results.skipped.push(`${staffId} (${name} ${surname}) — already exists`);
                continue;
            }

            // Parse birthday if provided
            let birthday: Date | undefined = undefined;
            if (birthdayStr) {
                const parsedDate = new Date(birthdayStr);
                if (!isNaN(parsedDate.getTime())) {
                    birthday = parsedDate;
                }
            }

            // Resolve courses if provided
            const matchedSubjectIds: number[] = [];
            if (coursesStr) {
                const courseCodes = coursesStr.split(/[,;|]/).map(c => c.trim().toLowerCase()).filter(Boolean);
                for (const code of courseCodes) {
                    const match = allSubjects.find(s =>
                        s.name.toLowerCase() === code ||
                        (s.title && s.title.toLowerCase() === code)
                    );
                    if (match) {
                        matchedSubjectIds.push(match.id);
                    }
                }
            }

            // Sanitize username for Clerk
            const clerkUsername = staffId.toLowerCase().replace(/[^a-z0-9_.]/g, "_");
            const defaultPassword = "CPE@Pass2025!";
            const clerkEmail = email || `${clerkUsername}@staff.cpe.edu.ng`;

            try {
                // Create or find Clerk user with sanitized staffId and default password
                let clerkUserId: string;
                try {
                    const user = await clerkClient().users.createUser({
                        username: clerkUsername,
                        password: defaultPassword,
                        firstName: name,
                        lastName: surname,
                        emailAddress: [clerkEmail],
                        publicMetadata: { role: "teacher", organizationId: organizationId },
                    });
                    clerkUserId = user.id;
                } catch (clerkErr: any) {
                    const byUsername = await clerkClient().users.getUserList({
                        username: [clerkUsername],
                    });
                    if (byUsername.data.length > 0) {
                        clerkUserId = byUsername.data[0].id;
                    } else {
                        const byEmail = await clerkClient().users.getUserList({
                            emailAddress: [clerkEmail],
                        });
                        if (byEmail.data.length > 0) {
                            clerkUserId = byEmail.data[0].id;
                        } else {
                            throw clerkErr;
                        }
                    }
                }

                // Create or update Teacher in database
                await prisma.teacher.upsert({
                    where: { username: staffId },
                    update: {
                        id: clerkUserId,
                        name,
                        surname,
                        email: email || null,
                        phone: phone || null,
                        address: address || null,
                        sex: sex || null,
                        birthday: birthday || null,
                        organizationId: organizationId,
                        ...(matchedSubjectIds.length > 0
                            ? {
                                subjects: {
                                    connect: matchedSubjectIds.map(id => ({ id })),
                                },
                            }
                            : {}),
                    },
                    create: {
                        id: clerkUserId,
                        username: staffId,
                        name,
                        surname,
                        email: email || null,
                        phone: phone || null,
                        address: address || null,
                        sex: sex || null,
                        birthday: birthday || null,
                        organizationId: organizationId,
                        ...(matchedSubjectIds.length > 0
                            ? {
                                subjects: {
                                    connect: matchedSubjectIds.map(id => ({ id })),
                                },
                            }
                            : {}),
                    },
                });

                results.created++;
            } catch (err: any) {
                const message =
                    err?.errors?.[0]?.longMessage ||
                    err?.errors?.[0]?.message ||
                    err?.message ||
                    "Unknown error";
                results.errors.push(`${staffId} — ${message}`);
            }
        }

        return NextResponse.json(results);
    } catch (err: any) {
        console.error("Lecturers CSV import error:", err);
        return NextResponse.json(
            { error: err.message || "Internal server error" },
            { status: 500 }
        );
    }
}
