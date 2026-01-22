import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST: Mark announcement as read
export async function POST(req: NextRequest) {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { announcementId } = await req.json();

        if (!announcementId) {
            return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
        }

        // Create or update read status
        await prisma.announcementRead.upsert({
            where: {
                announcementId_userId: {
                    announcementId: parseInt(announcementId),
                    userId: userId,
                },
            },
            update: {
                readAt: new Date(),
            },
            create: {
                announcementId: parseInt(announcementId),
                userId: userId,
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error marking announcement as read:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
