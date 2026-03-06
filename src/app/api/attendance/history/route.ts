export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
 
 

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const dateQuery = searchParams.get("date"); // YYYY-MM-DD

    if (!lessonId || !dateQuery) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const { sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (role !== "admin" && role !== "teacher") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const queryDate = new Date(dateQuery);
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        const attendance = await prisma.attendance.findMany({
            where: {
                lessonId: parseInt(lessonId),
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                studentId: true,
                present: true,
            }
        });

        return NextResponse.json(attendance);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}
