export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// POST /api/esp32
//
// Accepts JSON payloads from the ESP32 hardware device.
// Supports three event types:
//   • VERIFY  – fingerprint attendance verification
//   • ENROLL  – new fingerprint registration log
//   • SYNC    – batch upload of offline-cached records
//
// All requests must include a valid `deviceSecret`.
// ─────────────────────────────────────────────────────────────────

interface EventPayload {
    event: "VERIFY" | "ENROLL" | "SYNC";
    userID: string;       // e.g. "USER001"
    status: string;       // "SUCCESS" | "FAILED"
    timestamp?: string;   // ISO 8601 or "YYYY-MM-DD HH:MM:SS"
    deviceSecret: string;
}

interface SyncPayload {
    deviceSecret: string;
    records: EventPayload[];
}

// ── Authenticate device ──────────────────────────────────────────
function authenticateDevice(secret: string | undefined): NextResponse | null {
    if (!process.env.DEVICE_SECRET) {
        return NextResponse.json(
            { message: "ESP32 authentication is not configured on the server" },
            { status: 503 }
        );
    }
    if (!secret || secret !== process.env.DEVICE_SECRET) {
        return NextResponse.json(
            { message: "Invalid device secret" },
            { status: 401 }
        );
    }
    return null; // Auth passed
}

// ── Process a single event record ────────────────────────────────
async function processEvent(payload: EventPayload) {
    const { event, userID, status, timestamp } = payload;

    // Extract the raw fingerprint ID number from "USER001" → "1"
    // The biometricId stored in the Student table matches the userID format
    const biometricId = userID; // e.g. "USER001"

    if (event === "VERIFY" && status === "SUCCESS") {
        // ── Attendance verification ──────────────────────────────
        const student = await prisma.student.findUnique({
            where: { biometricId },
            include: { class: true },
        });

        if (!student) {
            return {
                userID,
                status: "STUDENT_NOT_FOUND",
                message: `No student linked to biometricId "${biometricId}"`,
            };
        }

        // Find an active attendance session for the student's class
        const activeSession = await prisma.attendanceSession.findFirst({
            where: {
                status: "OPEN",
                lesson: { classId: student.classId },
            },
            include: { lesson: true },
        });

        if (!activeSession) {
            return {
                userID,
                status: "NO_SESSION",
                message: "No active attendance session for this class",
            };
        }

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

        if (existing) {
            return {
                userID,
                status: "DUPLICATE",
                message: `Attendance already recorded for ${student.name}`,
            };
        }

        // Create attendance record
        await prisma.attendance.create({
            data: {
                date: timestamp ? new Date(timestamp) : new Date(),
                present: true,
                studentId: student.id,
                lessonId: activeSession.lessonId,
                organizationId: student.organizationId,
            },
        });

        return {
            userID,
            status: "RECORDED",
            message: `Attendance marked for ${student.name}`,
            lesson: activeSession.lesson.name,
        };
    }

    if (event === "VERIFY" && status === "FAILED") {
        // Just acknowledge — failed verifications are logged on the SD card
        return { userID, status: "ACK", message: "Failed verification acknowledged" };
    }

    if (event === "ENROLL") {
        if (status === "SUCCESS") {
            // Clear the pending command since it was successful
            await prisma.deviceHeartbeat.updateMany({
                where: { deviceId: "ESP32_MAIN" },
                data: { pendingCommand: null }
            });
            return {
                userID,
                status: "ACK",
                message: `Enrollment SUCCESS for ${userID}`,
            };
        }

        if (status === "FAILED") {
            // Enrollment failed on the sensor — clear the student's biometricId
            // so they can try again
            await prisma.student.updateMany({
                where: { biometricId },
                data: { biometricId: null },
            });
            await prisma.deviceHeartbeat.updateMany({
                where: { deviceId: "ESP32_MAIN" },
                data: { pendingCommand: null }
            });
            return {
                userID,
                status: "ACK",
                message: `Enrollment FAILED for ${userID} — biometricId cleared`,
            };
        }

        return {
            userID,
            status: "ACK",
            message: `Enrollment event logged for ${userID}`,
        };
    }

    return { userID, status: "UNKNOWN_EVENT", message: `Unrecognised event: ${event}` };
}

// ─────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────
export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();

        // ── Batch sync mode ──────────────────────────────────────
        if (Array.isArray(body.records)) {
            const { deviceSecret, records } = body as SyncPayload;

            const authError = authenticateDevice(deviceSecret);
            if (authError) return authError;

            const results = [];
            for (const record of records) {
                try {
                    const result = await processEvent(record);
                    results.push(result);
                } catch (err) {
                    results.push({
                        userID: record.userID,
                        status: "ERROR",
                        message: String(err),
                    });
                }
            }

            return NextResponse.json(
                { message: "Sync complete", results, synced: results.length },
                { status: 200 }
            );
        }

        // ── Single event mode ────────────────────────────────────
        const { deviceSecret, event, userID, status } = body as EventPayload;

        const authError = authenticateDevice(deviceSecret);
        if (authError) return authError;

        if (!event || !userID || !status) {
            return NextResponse.json(
                { message: "Missing required fields: event, userID, status" },
                { status: 400 }
            );
        }

        const result = await processEvent(body as EventPayload);
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("ESP32 API error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/esp32  —  Health-check / command polling
//
// The ESP32 can poll this endpoint to receive commands from the
// dashboard (e.g. switch to verification/registration mode).
// For now this returns a simple health-check response.
// ─────────────────────────────────────────────────────────────────
export const GET = async (req: NextRequest) => {
    const secret = req.nextUrl.searchParams.get("deviceSecret");

    const authError = authenticateDevice(secret ?? undefined);
    if (authError) return authError;

    // Future: return pending commands from a DeviceCommand table
    return NextResponse.json(
        { status: "ok", command: "none", serverTime: new Date().toISOString() },
        { status: 200 }
    );
};
