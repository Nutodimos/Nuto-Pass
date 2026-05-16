import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Queue the EMPTY_ALL command for the ESP32
        await prisma.deviceHeartbeat.updateMany({
            where: { deviceId: "ESP32_MAIN" },
            data: { pendingCommand: "EMPTY_ALL" },
        });

        // Also clear all student biometricIds and stored templates
        await prisma.biometricTemplate.deleteMany({});
        await prisma.student.updateMany({
            where: { biometricId: { not: null } },
            data: { biometricId: null },
        });

        return NextResponse.json({
            message: "Emergency wipe initiated. All sensor data will be cleared on the next heartbeat.",
        });
    } catch (error) {
        console.error("Biometric wipe error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
