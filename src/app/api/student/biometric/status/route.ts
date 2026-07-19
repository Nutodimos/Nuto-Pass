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

        // The ESP32 will post SUCCESS or FAILED to /api/esp32.
        // - SUCCESS changes PENDING-USERxxx to USERxxx
        // - FAILED changes PENDING-USERxxx to null

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { biometricId: true },
        });

        if (!student?.biometricId) {
            return NextResponse.json({ status: "FAILED", deviceMode: "UNKNOWN" });
        }

        if (student.biometricId.startsWith("PENDING-")) {
            return NextResponse.json({ status: "PENDING", deviceMode: "UNKNOWN" });
        }

        return NextResponse.json({ status: "SUCCESS", deviceMode: "UNKNOWN" });

    } catch (error) {
        console.error("Biometric status error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
};
