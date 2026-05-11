export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const DELETE = async (req: NextRequest) => {
    try {
        const { sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (role !== "admin" && role !== "teacher") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json({ message: "Student ID required" }, { status: 400 });
        }

        // Fetch student to get their current biometric slot
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { biometricId: true }
        });

        if (!student || !student.biometricId) {
             return NextResponse.json({ message: "No biometric data to delete" }, { status: 400 });
        }

        // 1. Remove biometric ID from DB
        await prisma.student.update({
            where: { id: studentId },
            data: { biometricId: null },
        });

        // 2. Queue a DELETE command for the ESP32 to clear the slot
        const slotNum = parseInt(student.biometricId.replace("USER", ""), 10);
        if (!isNaN(slotNum) && slotNum > 0) {
            await prisma.deviceHeartbeat.updateMany({
                where: { deviceId: "ESP32_MAIN" },
                data: { pendingCommand: `DELETE:${slotNum}` },
            });
        }

        return NextResponse.json({ message: "Biometric data deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting biometric:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
};
