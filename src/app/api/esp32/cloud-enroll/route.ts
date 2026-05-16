import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────
// POST /api/esp32/cloud-enroll
//
// Receives a raw fingerprint image from the ESP32 and stores it
// as a BiometricTemplate linked to a student.
// ─────────────────────────────────────────────────────────────────

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { deviceSecret, slotId, image_base64 } = body;

        // 1. Authenticate device
        if (!deviceSecret || deviceSecret !== process.env.DEVICE_SECRET) {
            return NextResponse.json({ message: "Invalid device secret" }, { status: 401 });
        }

        if (!slotId || !image_base64) {
            return NextResponse.json({ message: "Missing slotId or image_base64" }, { status: 400 });
        }

        // 2. Find the student linked to this slot
        const biometricId = `USER${String(slotId).padStart(3, "0")}`;
        const student = await prisma.student.findUnique({
            where: { biometricId },
        });

        if (!student) {
            return NextResponse.json({ 
                message: `No student found for slot ${slotId} (${biometricId})` 
            }, { status: 404 });
        }

        // 3. Store the biometric template
        // We use upsert to handle re-enrollment
        await prisma.biometricTemplate.upsert({
            where: { studentId: student.id },
            update: { imageBase64: image_base64 },
            create: {
                studentId: student.id,
                imageBase64: image_base64,
            },
        });

        // 4. Update the heartbeat to clear the pending command if it matches
        await prisma.deviceHeartbeat.updateMany({
            where: { deviceId: "ESP32_MAIN", pendingCommand: `CLOUD_ENROLL:${slotId}` },
            data: { pendingCommand: null },
        });

        console.log(`[CLOUD-ENROLL] Successfully stored template for student ${student.id} (${student.name})`);

        return NextResponse.json({ 
            status: "SUCCESS", 
            message: `Template stored for ${student.name}` 
        }, { status: 200 });

    } catch (error) {
        console.error("[CLOUD-ENROLL] Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
