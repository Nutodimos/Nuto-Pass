export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const GET = async (
    req: NextRequest,
    { params }: { params: { id: string } }
) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin" && role !== "teacher") {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    try {
        const sessionId = parseInt(params.id);
        if (isNaN(sessionId)) {
            return NextResponse.json({ message: "Invalid session ID" }, { status: 400 });
        }

        // Find the session to get the lesson ID and timeframe
        const session = await prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: { lesson: true },
        });

        if (!session) {
            return NextResponse.json({ message: "Session not found" }, { status: 404 });
        }

        // Get all attendances for this lesson recorded during or after this session's startTime
        // Note: The ESP32 sends local time (UTC+1) which the Vercel server (UTC) 
        // misinterprets as being 1 hour in the future. To fix this without requiring a firmware flash,
        // we use a flexible endTime boundary (current time + 24 hours).
        const endTimeBoundary = session.endTime 
            ? new Date(session.endTime.getTime() + (24 * 60 * 60 * 1000)) 
            : new Date(Date.now() + (24 * 60 * 60 * 1000));
        
        const attendances = await prisma.attendance.findMany({
            where: {
                lessonId: session.lessonId,
                date: {
                    gte: session.startTime,
                    lte: endTimeBoundary,
                },
                present: true,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        img: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        // Format for the frontend
        const count = attendances.length;
        const recent = attendances.map((a) => ({
            id: a.student.id,
            name: a.student.name,
            surname: a.student.surname,
            img: a.student.img,
            timestamp: a.date,
        }));

        return NextResponse.json({ count, recent }, { status: 200 });
    } catch (error) {
        console.error("Error fetching attendees:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
