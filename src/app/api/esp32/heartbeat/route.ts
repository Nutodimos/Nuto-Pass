export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────
// POST /api/esp32/heartbeat
//
// Called periodically by the ESP32 to report its alive status.
// Stores the latest heartbeat in the DeviceHeartbeat table.
// Authenticated via DEVICE_SECRET.
// ─────────────────────────────────────────────────────────────────

function authenticateDevice(secret: string | undefined): NextResponse | null {
    if (!process.env.DEVICE_SECRET) {
        return NextResponse.json(
            { message: "ESP32 authentication is not configured" },
            { status: 503 }
        );
    }
    if (!secret || secret !== process.env.DEVICE_SECRET) {
        return NextResponse.json(
            { message: "Invalid device secret" },
            { status: 401 }
        );
    }
    return null;
}

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const authError = authenticateDevice(body.deviceSecret);
        if (authError) return authError;

        const deviceId = body.deviceId || "ESP32_MAIN";
        const mode = body.mode || "UNKNOWN";
        const wifiRSSI = body.rssi ?? null;
        const freeHeap = body.freeHeap ?? null;
        const sdReady = body.sdReady ?? false;
        const sensorStatus = body.sensorStatus ?? false;
        const uptime = body.uptime ?? 0;

        const updated = await prisma.deviceHeartbeat.upsert({
            where: { deviceId },
            update: {
                lastSeen: new Date(),
                mode,
                wifiRSSI,
                freeHeap,
                sdReady,
                sensorStatus,
                uptime,
            },
            create: {
                deviceId,
                lastSeen: new Date(),
                mode,
                wifiRSSI,
                freeHeap,
                sdReady,
                sensorStatus,
                uptime,
            },
        });

        // Grab the pending command, then clear it so it's only sent once
        const pendingCmd = updated.pendingCommand;
        if (pendingCmd) {
            await prisma.deviceHeartbeat.update({
                where: { deviceId },
                data: { pendingCommand: null },
            });
        }

        return NextResponse.json(
            { status: "ok", command: pendingCmd || "none", serverTime: new Date().toISOString() },
            { status: 200 }
        );
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
