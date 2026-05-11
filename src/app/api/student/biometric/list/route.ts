import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const students = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                surname: true,
                biometricId: true,
                img: true,
                class: {
                    select: { name: true }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(students);
    } catch (error) {
        console.error("Biometric list error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
};
