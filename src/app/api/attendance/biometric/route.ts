export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => { 
    const { default: prisma } = await import("@/lib/prisma");
 
 

    try {
        const body = await req.json();
        const { biometricId, deviceSecret } = body;

        // Fail closed: reject if DEVICE_SECRET is not configured
        if (!process.env.DEVICE_SECRET) {
            return NextResponse.json(
                { message: "Biometric authentication is not configured" },
                { status: 503 }
            );
        }

        // Validate device secret
        if (!deviceSecret || deviceSecret !== process.env.DEVICE_SECRET) {
            return NextResponse.json(
                { message: "Invalid Device Secret" },
                { status: 401 }
            );
        }

        if (!biometricId) {
            return NextResponse.json({ message: "Biometric ID is required" }, { status: 400 });
        }

        // 2. Find Student by Biometric ID
        const student = await prisma.student.findUnique({
            where: { biometricId: biometricId },
            include: { class: true },
        });

        if (!student) {
            return NextResponse.json({ message: "Student not found" }, { status: 404 });
        }

        // 3. Find Active Attendance Session for Student's Class
        const activeSession = await prisma.attendanceSession.findFirst({
            where: {
                status: "OPEN",
                lesson: {
                    classId: student.classId,
                },
            },
            include: {
                lesson: true,
            },
        });

        if (!activeSession) {
            return NextResponse.json(
                { message: "No active attendance session found for this student's class." },
                { status: 404 }
            );
        }

        // 4. Record Attendance
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                studentId: student.id,
                lessonId: activeSession.lessonId,
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                }
            },
        });

        if (existingAttendance) {
            return NextResponse.json(
                { message: "Attendance already recorded for " + student.name },
                { status: 200 }
            );
        }

        await prisma.attendance.create({
            data: {
                date: new Date(),
                present: true,
                studentId: student.id,
                lessonId: activeSession.lessonId,
            },
        });

        return NextResponse.json(
            { message: "Attendance marked for " + student.name, lesson: activeSession.lesson.name },
            { status: 201 }
        );
    } catch (error) {
        console.error("Biometric attendance error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
