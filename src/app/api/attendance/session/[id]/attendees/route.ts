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

        // Get all attendances for this lesson recorded during this session's timeframe
        // (From startTime until now, or endTime if closed)
        const endTime = session.endTime || new Date();
        
        const attendances = await prisma.attendance.findMany({
            where: {
                lessonId: session.lessonId,
                date: {
                    gte: session.startTime,
                    lte: endTime,
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
