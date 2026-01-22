import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId, sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (!role) {
            return NextResponse.json({ announcements: [] }, { status: 200 });
        }

        // Filter based on target audience
        const audienceFilter: any[] = [{ targetAudience: "all" }];

        if (role === "student") {
            audienceFilter.push({ targetAudience: "students" });
        } else if (role === "teacher") {
            audienceFilter.push({ targetAudience: "teachers" });
        }

        // Fetch recent unread announcements (last 10 unread)
        const announcements = await prisma.announcement.findMany({
            where: {
                AND: [
                    { OR: audienceFilter },
                    {
                        // Only announcements that haven't been read by this user
                        reads: {
                            none: {
                                userId: userId!,
                            },
                        },
                    },
                ],
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
        return NextResponse.json({ announcements: [] }, { status: 500 });
    }
}
