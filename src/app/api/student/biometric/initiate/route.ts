import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

        if (student.biometricId && student.biometricId.startsWith("USER")) {
            // Reuse existing slot
            slotId = parseInt(student.biometricId.replace("USER", ""), 10);
        } else {
            // Find next available slot
            const allStudents = await prisma.student.findMany({
                where: { biometricId: { not: null } },
                select: { biometricId: true },
            });

            const usedSlots = allStudents
                .map(s => parseInt(s.biometricId!.replace("USER", ""), 10))
                .filter(n => !isNaN(n));

            if (usedSlots.length > 0) {
                slotId = Math.max(...usedSlots) + 1;
            }

            if (slotId > 127) {
                return NextResponse.json({ message: "Scanner memory full (127 slots max)" }, { status: 400 });
            }

            // Reserve the slot for this student
            const biometricIdStr = `USER${String(slotId).padStart(3, "0")}`;
            await prisma.student.update({
                where: { id: studentId },
                data: { biometricId: biometricIdStr },
            });
        }

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
