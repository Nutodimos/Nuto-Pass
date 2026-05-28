export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/student/biometric/status?studentId=xxx
// 
// Checks if the ESP32 has posted an ENROLL result for this student.
// Returns: { status: "SUCCESS" | "FAILED" | "PENDING" }
//
// Logic: The ESP32 posts to /api/esp32 with event=ENROLL and status=SUCCESS or FAILED.
// We check if the student's biometricId still exists (it was set during initiate).
// If the ESP32 posted SUCCESS, the biometricId remains.
// If the ESP32 posted FAILED or hasn't responded, we check the device mode.

export const GET = async (req: NextRequest) => {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("studentId");

        if (!studentId) {
            return NextResponse.json({ message: "Student ID required" }, { status: 400 });
        }

        // Check the device's current mode
        const heartbeat = await prisma.deviceHeartbeat.findFirst({
            where: { deviceId: "ESP32_MAIN" },
            orderBy: { lastSeen: "desc" },
        });

        const deviceMode = heartbeat?.mode || "UNKNOWN";

        // If device is still in REGISTRATION mode, enrollment is still in progress
        if (deviceMode === "REGISTRATION") {
            return NextResponse.json({ status: "PENDING", deviceMode });
        }

        // Device left registration mode — check if the ESP32 event log has a result.
        // Look for the most recent ESP32 event for this student's biometric slot.
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { biometricId: true },
        });

        if (!student?.biometricId) {
            // biometricId was cleared — means it failed or was never set
            return NextResponse.json({ status: "FAILED", deviceMode });
        }

        // Check if there's a recent attendance/event record indicating success.
        // The ESP32 posts ENROLL/SUCCESS to /api/esp32 which creates an event.
        // We look for a recent event with the student's userID.
        // 
        // Since the ESP32 uses postToServer("ENROLL", slotId, "SUCCESS"),
        // and we stored the biometricId on the student during initiate,
        // if the device went back to DEFAULT and biometricId still exists,
        // we consider it SUCCESS (the ESP32 confirmed by not clearing it).
        // 
        // If it FAILED, the ESP32 posts ENROLL/FAILED and we should clear biometricId.

        // Check the last heartbeat — if device returned to DEFAULT with no pending command,
        // and the student still has a biometricId, the enrollment succeeded.
        // We'll also check if there's a very recent heartbeat (within 30s) confirming this.
        
        if (heartbeat) {
            const lastSeenMs = Date.now() - new Date(heartbeat.lastSeen).getTime();
            if (lastSeenMs < 60000) {
                // Device was recently seen and is no longer in registration
                // If the student still has a biometricId, enrollment succeeded
                return NextResponse.json({ status: "SUCCESS", deviceMode });
            }
        }

        // Fallback — device hasn't reported recently
        return NextResponse.json({ status: "PENDING", deviceMode });

    } catch (error) {
        console.error("Biometric status error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
};
