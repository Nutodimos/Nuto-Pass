import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// POST /api/esp32/cloud-verify
//
// Receives a probe image from ESP32, matches it against all stored
// templates via the Python microservice using chunked parallel
// bulk matching for O(1) network latency regardless of student count.
// ─────────────────────────────────────────────────────────────────

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || "http://127.0.0.1:8001";
const BATCH_SIZE = 30; // Templates per batch — keeps each request under ~1.5MB

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

        console.log(`[CLOUD-VERIFY] Matching probe against ${templates.length} templates (batch size: ${BATCH_SIZE})...`);

        // 3. Split templates into batches
        const batches: typeof templates[] = [];
        for (let i = 0; i < templates.length; i += BATCH_SIZE) {
            batches.push(templates.slice(i, i + BATCH_SIZE));
        }

        console.log(`[CLOUD-VERIFY] Created ${batches.length} batch(es)`);

        // 4. Fire all batches concurrently via /match-bulk
        const batchPromises = batches.map(async (batch, batchIndex) => {
            try {
                const response = await fetch(`${BIOMETRIC_SERVICE_URL}/match-bulk`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        probe_base64: image_base64,
                        candidates: batch.map(t => ({
                            id: t.studentId,
                            name: `${t.student.name} ${t.student.surname}`,
                            image_base64: t.imageBase64,
                        })),
                    }),
                });

                if (!response.ok) {
                    console.error(`[CLOUD-VERIFY] Batch ${batchIndex} service error: ${response.status}`);
                    return null;
                }

                const data = await response.json();
                console.log(`[CLOUD-VERIFY] Batch ${batchIndex}: match=${data.match} best=${data.best_score} (${data.best_name}) checked=${data.candidates_checked}`);
                return data;
            } catch (err) {
                console.error(`[CLOUD-VERIFY] Batch ${batchIndex} failed:`, err);
                return null;
            }
        });

        // Wait for all batches to complete
        const results = await Promise.all(batchPromises);

        // 5. Find the best match across all batches
        let matchResult: { studentId: string; studentName: string; score: number } | null = null;
        let bestScore = 0;
        let bestCandidate = "";

        for (const result of results) {
            if (!result) continue;

            if (result.best_score > bestScore) {
                bestScore = result.best_score;
                bestCandidate = result.best_name || "";
            }

            if (result.match && !matchResult) {
                // Find the matching student's ID from our templates
                const matchedTemplate = templates.find(t => t.studentId === result.matched_id);
                if (matchedTemplate) {
                    matchResult = {
                        studentId: result.matched_id,
                        studentName: result.matched_name,
                        score: result.score,
                    };
                }
            }
        }

        if (!matchResult) {
            console.log(`[CLOUD-VERIFY] No match. Best score: ${bestScore} (${bestCandidate})`);
            return NextResponse.json({ match: false, bestScore, bestCandidate }, { status: 200 });
        }

        // 6. Record Attendance
        const student = await prisma.student.findUnique({
            where: { id: matchResult.studentId },
            select: { id: true, classId: true }
        });

        let attendanceRecorded = false;

        if (student) {
            console.log(`[CLOUD-VERIFY] Looking for open session for classId=${student.classId}`);

            const activeSession = await prisma.attendanceSession.findFirst({
                where: {
                    status: "OPEN",
                    lesson: { classId: student.classId },
                },
                include: { lesson: true },
            });

            // Find a lesson to record against — active session first, fallback to most recent lesson
            let lessonId: number | null = null;

            if (activeSession) {
                lessonId = activeSession.lessonId;
                console.log(`[CLOUD-VERIFY] Found active session for lesson: ${activeSession.lesson.name}`);
            } else {
                console.log(`[CLOUD-VERIFY] No active session — using fallback (most recent lesson)`);
                const recentLesson = await prisma.lesson.findFirst({
                    where: { classId: student.classId },
                    orderBy: { id: "desc" },
                });
                if (recentLesson) {
                    lessonId = recentLesson.id;
                    console.log(`[CLOUD-VERIFY] Fallback lesson: ${recentLesson.name} (id=${recentLesson.id})`);
                }
            }

            if (lessonId) {
                // Guard against duplicate attendance today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const existing = await prisma.attendance.findFirst({
                    where: {
                        studentId: student.id,
                        lessonId: lessonId,
                        date: { gte: todayStart, lt: todayEnd },
                    },
                });

                if (!existing) {
                    await prisma.attendance.create({
                        data: {
                            date: new Date(),
                            present: true,
                            studentId: student.id,
                            lessonId: lessonId,
                        },
                    });
                    attendanceRecorded = true;
                    console.log(`[CLOUD-VERIFY] ✓ Attendance recorded for ${matchResult.studentName}`);
                } else {
                    console.log(`[CLOUD-VERIFY] Attendance already exists for today — skipped`);
                }
            } else {
                console.log(`[CLOUD-VERIFY] No lessons found for class — cannot record attendance`);
            }
        }

        return NextResponse.json({ 
            match: true, 
            studentName: matchResult.studentName,
            confidence: matchResult.score,
            attendanceRecorded,
        }, { status: 200 });

    } catch (error) {
        console.error("[CLOUD-VERIFY] Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
