export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => { 
    const { default: prisma } = await import("@/lib/prisma");
 

    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { studentId, biometricId } = body;

        if (!studentId || !biometricId) {
            return NextResponse.json(
                { message: "Student ID and Biometric ID are required" },
                { status: 400 }
            );
        }

        // Check if biometric ID is already in use
        const existing = await prisma.student.findUnique({
            where: { biometricId },
        });

        if (existing && existing.id !== studentId) {
            return NextResponse.json(
                { message: "Biometric ID already assigned to another student!" },
                { status: 409 }
            );
        }

        const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: { biometricId },
        });

        return NextResponse.json(
            { message: "Biometric ID registered successfully", student: updatedStudent },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating biometric ID:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
