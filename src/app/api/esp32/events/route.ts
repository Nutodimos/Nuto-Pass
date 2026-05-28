export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// ─────────────────────────────────────────────────────────────────
// GET /api/esp32/events
//
// Returns device status + recent attendance events for the dashboard.
// Authenticated via Clerk session (dashboard users only).
// ─────────────────────────────────────────────────────────────────

export const GET = async (req: NextRequest) => {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch device heartbeat
        const heartbeat = await prisma.deviceHeartbeat.findFirst({
            orderBy: { lastSeen: "desc" },
        });

        // Fetch today's attendance records with student info
        const todaysAttendance = await prisma.attendance.findMany({
            where: {
                date: { gte: today, lt: tomorrow },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        img: true,
                        biometricId: true,
                    },
                },
                lesson: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { date: "desc" },
            take: 50,
        });

        // Compute stats
        const totalScans = todaysAttendance.length;
        const successfulScans = todaysAttendance.filter((a) => a.present).length;
        const failedScans = totalScans - successfulScans;

        // Determine device status from heartbeat
        let deviceStatus: "online" | "idle" | "offline" = "offline";
        let lastSeenAgo = -1;

        if (heartbeat) {
            const diffMs = Date.now() - new Date(heartbeat.lastSeen).getTime();
            lastSeenAgo = Math.floor(diffMs / 1000);

            if (lastSeenAgo < 60) deviceStatus = "online";
            else if (lastSeenAgo < 300) deviceStatus = "idle";
            else deviceStatus = "offline";
        }

        // Format recent events for the feed
        const recentEvents = todaysAttendance.slice(0, 10).map((a) => ({
            id: a.id,
            studentName: a.student
                ? `${a.student.name} ${a.student.surname}`
                : "Unknown",
            studentImg: a.student?.img || null,
            biometricId: a.student?.biometricId || null,
            lessonName: a.lesson?.name || "N/A",
            present: a.present,
            timestamp: a.date.toISOString(),
        }));

        return NextResponse.json({
            device: {
                status: deviceStatus,
                lastSeen: heartbeat?.lastSeen?.toISOString() || null,
                lastSeenAgo,
                mode: heartbeat?.mode || "UNKNOWN",
                wifiRSSI: heartbeat?.wifiRSSI || null,
                freeHeap: heartbeat?.freeHeap || null,
                sdReady: heartbeat?.sdReady ?? false,
                sensorStatus: heartbeat?.sensorStatus ?? false,
                uptime: heartbeat?.uptime || 0,
                pendingCommand: heartbeat?.pendingCommand || null,
            },
            stats: {
                totalScans,
                successfulScans,
                failedScans,
            },
            recentEvents,
        });
    } catch (error) {
        console.error("Events API error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
