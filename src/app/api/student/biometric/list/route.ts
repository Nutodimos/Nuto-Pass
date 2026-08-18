import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
    try {
        const { userId, sessionClaims } = auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (!userId || (role !== "admin" && role !== "teacher")) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        let whereCondition: any = { isActive: true };

        if (role === "teacher") {
            whereCondition = {
                isActive: true,
                OR: [
                    {
                        enrollments: {
                            some: {
                                subject: {
                                    teachers: {
                                        some: { id: userId },
                                    },
                                },
                            },
                        },
                    },
                    {
                        class: {
                            supervisorId: userId,
                        },
                    },
                    {
                        class: {
                            lessons: {
                                some: { teacherId: userId },
                            },
                        },
                    },
                ],
            };
        }

        const students = await prisma.student.findMany({
            where: whereCondition,
            select: {
                id: true,
                username: true,
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
