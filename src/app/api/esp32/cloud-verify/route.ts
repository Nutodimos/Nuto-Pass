import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// POST /api/esp32/cloud-verify
//
// Receives a probe image from ESP32, matches it against all stored
// templates via the Python microservice, and records attendance.
// ─────────────────────────────────────────────────────────────────

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || "http://127.0.0.1:8001/match";

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { deviceSecret, image_base64 } = body;

        // 1. Authenticate device
        if (!deviceSecret || deviceSecret !== process.env.DEVICE_SECRET) {
            return NextResponse.json({ message: "Invalid device secret" }, { status: 401 });
        }

        if (!image_base64) {
            return NextResponse.json({ message: "Missing image_base64" }, { status: 400 });
        }

        // 2. Fetch all biometric templates
        const templates = await prisma.biometricTemplate.findMany({
            include: { student: true }
        });

        if (templates.length === 0) {
            return NextResponse.json({ match: false, message: "No templates enrolled" }, { status: 200 });
        }

        console.log(`[CLOUD-VERIFY] Matching probe against ${templates.length} templates...`);

        // 3. Iterate and match via Python Service
        // For small student counts, we can do this sequentially.
        let matchResult = null;

        for (const template of templates) {
            try {
                const response = await fetch(BIOMETRIC_SERVICE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        probe_base64: image_base64,
                        candidate_base64: template.imageBase64
                    }),
                });

                if (!response.ok) {
                    console.error(`[CLOUD-VERIFY] Biometric service error: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                if (data.match) {
                    matchResult = {
                        studentId: template.studentId,
                        studentName: `${template.student.name} ${template.student.surname}`,
                        score: data.score
                    };
                    break; // Found a match!
                }
            } catch (err) {
                console.error(`[CLOUD-VERIFY] Failed to connect to biometric service:`, err);
                return NextResponse.json({ message: "Biometric matching service unavailable" }, { status: 503 });
            }
        }

        if (!matchResult) {
            return NextResponse.json({ match: false }, { status: 200 });
        }

        // 4. Record Attendance
        // Find an active session for the student's class
        const student = await prisma.student.findUnique({
            where: { id: matchResult.studentId },
            select: { id: true, classId: true }
        });

        if (student) {
            const activeSession = await prisma.attendanceSession.findFirst({
                where: {
                    status: "OPEN",
                    lesson: { classId: student.classId },
                },
            });

            if (activeSession) {
                // Guard against duplicate attendance for the same lesson today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const existing = await prisma.attendance.findFirst({
                    where: {
                        studentId: student.id,
                        lessonId: activeSession.lessonId,
                        date: { gte: todayStart, lt: todayEnd },
                    },
                });

                if (!existing) {
                    await prisma.attendance.create({
                        data: {
                            date: new Date(),
                            present: true,
                            studentId: student.id,
                            lessonId: activeSession.lessonId,
                        },
                    });
                    console.log(`[CLOUD-VERIFY] Attendance recorded for ${matchResult.studentName}`);
                }
            }
        }

        return NextResponse.json({ 
            match: true, 
            studentName: matchResult.studentName,
            confidence: matchResult.score
        }, { status: 200 });

    } catch (error) {
        console.error("[CLOUD-VERIFY] Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
