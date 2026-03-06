import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId, sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (!role || !userId) {
            return NextResponse.json({ announcements: [], unreadCount: 0 }, { status: 200 });
        }

        const audienceFilter: any[] = [{ targetAudience: "all" }];

        if (role === "student") {
            audienceFilter.push({ targetAudience: "students" });
        } else if (role === "teacher") {
            audienceFilter.push({ targetAudience: "teachers" });
        }

        const announcements = await prisma.announcement.findMany({
            where: {
                OR: audienceFilter,
            },
            orderBy: {
                date: "desc",
            },
            take: 10,
            select: {
                id: true,
                title: true,
                description: true,
                date: true,
                targetAudience: true,
            },
        });

        return NextResponse.json({
            announcements,
            unreadCount: announcements.length
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return NextResponse.json({ announcements: [], unreadCount: 0 }, { status: 500 });
    }
}
