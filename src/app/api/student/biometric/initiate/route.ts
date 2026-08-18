import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
    try {
        const { userId, sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (!userId || (role !== "admin" && role !== "teacher")) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ message: "Student ID required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        let slotId = 1;
        let biometricIdStr = "";

        if (student.biometricId && student.biometricId.startsWith("USER")) {
            // Reuse existing slot
            slotId = parseInt(student.biometricId.replace("USER", ""), 10);
            biometricIdStr = `PENDING-USER${String(slotId).padStart(3, "0")}`;
        } else if (student.biometricId && student.biometricId.startsWith("PENDING-USER")) {
            slotId = parseInt(student.biometricId.replace("PENDING-USER", ""), 10);
            biometricIdStr = student.biometricId;
        } else {
            // Find next available slot
            const allStudents = await prisma.student.findMany({
                where: { biometricId: { not: null } },
                select: { biometricId: true },
            });

            const usedSlots = allStudents
                .map(s => parseInt(s.biometricId!.replace("PENDING-USER", "").replace("USER", ""), 10))
                .filter(n => !isNaN(n));

            if (usedSlots.length > 0) {
                slotId = Math.max(...usedSlots) + 1;
            }

            if (slotId > 127) {
                return NextResponse.json({ message: "Scanner memory full (127 slots max)" }, { status: 400 });
            }

            biometricIdStr = `PENDING-USER${String(slotId).padStart(3, "0")}`;
        }

        // Set to pending so they don't show up as registered until the device confirms
        await prisma.student.update({
            where: { id: studentId },
            data: { biometricId: biometricIdStr },
        });

        // Queue the command for the ESP32
        await prisma.deviceHeartbeat.upsert({
            where: { deviceId: "ESP32_MAIN" },
            update: { pendingCommand: `ENROLL:${slotId}` },
            create: {
                deviceId: "ESP32_MAIN",
                pendingCommand: `ENROLL:${slotId}`,
                organizationId: student.organizationId,
            },
        });

        return NextResponse.json({
            message: "Registration initiated on device",
            slotId,
        });
    } catch (error) {
        console.error("Biometric initiate error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
