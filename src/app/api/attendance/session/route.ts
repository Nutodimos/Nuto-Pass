export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const POST = async (req: NextRequest) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin" && role !== "teacher") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { lessonId } = body;

        if (!lessonId) {
            return NextResponse.json({ message: "Lesson ID is required" }, { status: 400 });
        }

        // Check if session is already open
        const existingSession = await prisma.attendanceSession.findFirst({
            where: {
                lessonId: Number(lessonId),
                status: "OPEN",
            },
        });

        if (existingSession) {
            return NextResponse.json(
                { message: "Session already active", session: existingSession },
                { status: 200 }
            );
        }

        // Create new session
        const newSession = await prisma.attendanceSession.create({
            data: {
                lessonId: Number(lessonId),
                status: "OPEN",
                startTime: new Date(),
            },
        });

        // Tell device to enter verification mode
        await prisma.deviceHeartbeat.updateMany({
            where: { deviceId: "ESP32_MAIN" },
            data: { pendingCommand: "VERIFY:START" },
        });

        return NextResponse.json(
            { message: "Session started", session: newSession },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating session:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const PUT = async (req: NextRequest) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin" && role !== "teacher") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ message: "Session ID is required" }, { status: 400 });
        }

        const updatedSession = await prisma.attendanceSession.update({
            where: { id: parseInt(sessionId) },
            data: {
                status: "CLOSED",
                endTime: new Date(),
            },
        });

        // Tell device to return to idle mode
        await prisma.deviceHeartbeat.updateMany({
            where: { deviceId: "ESP32_MAIN" },
            data: { pendingCommand: "VERIFY:STOP" },
        });

        return NextResponse.json(
            { message: "Session closed", session: updatedSession },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error closing session:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const GET = async (req: NextRequest) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin" && role !== "teacher") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
        return NextResponse.json({ message: "Lesson ID is required" }, { status: 400 });
    }

    try {
        const session = await prisma.attendanceSession.findFirst({
            where: {
                lessonId: Number(lessonId),
                status: "OPEN",
            },
        });

        return NextResponse.json(session || null, { status: 200 });
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
