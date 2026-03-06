export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const GET = async (req: NextRequest) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // Only authenticated users can search
    if (!role) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] }, { status: 200 });
    }

    try {
        const searchQuery = query.toLowerCase();

        // Run parallel searches across multiple entities
        const [students, teachers, subjects, lessons, classes] = await Promise.all([
            // Search Students (admin and teacher only)
            role === "admin" || role === "teacher"
                ? prisma.student.findMany({
                    where: {
                        OR: [
                            { name: { contains: searchQuery, mode: "insensitive" } },
                            { surname: { contains: searchQuery, mode: "insensitive" } },
                            { username: { contains: searchQuery, mode: "insensitive" } },
                            { email: { contains: searchQuery, mode: "insensitive" } },
                        ],
                    },
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        username: true,
                        img: true,
                        class: { select: { name: true } },
                    },
                    take: 5,
                })
                : [],

            // Search Teachers/Lecturers (admin only)
            role === "admin"
                ? prisma.teacher.findMany({
                    where: {
                        OR: [
                            { name: { contains: searchQuery, mode: "insensitive" } },
                            { surname: { contains: searchQuery, mode: "insensitive" } },
                            { username: { contains: searchQuery, mode: "insensitive" } },
                            { email: { contains: searchQuery, mode: "insensitive" } },
                        ],
                    },
                    select: {
                        id: true,
                        name: true,
                        surname: true,
                        username: true,
                        img: true,
                    },
                    take: 5,
                })
                : [],

            // Search Subjects/Courses (all roles)
            prisma.subject.findMany({
                where: {
                    name: { contains: searchQuery, mode: "insensitive" },
                },
                select: {
                    id: true,
                    name: true,
                    _count: { select: { lessons: true, teachers: true } },
                },
                take: 5,
            }),

            // Search Lessons (all roles)
            prisma.lesson.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { subject: { name: { contains: searchQuery, mode: "insensitive" } } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    day: true,
                    subject: { select: { name: true } },
                    class: { select: { name: true } },
                    teacher: { select: { name: true, surname: true } },
                },
                take: 5,
            }),

            // Search Classes (admin and teacher)
            role === "admin" || role === "teacher"
                ? prisma.class.findMany({
                    where: {
                        name: { contains: searchQuery, mode: "insensitive" },
                    },
                    select: {
                        id: true,
                        name: true,
                        _count: { select: { students: true } },
                        supervisor: { select: { name: true, surname: true } },
                    },
                    take: 5,
                })
                : [],
        ]);

        // Format results with type information
        const results = [
            ...students.map((s) => ({
                type: "student" as const,
                id: s.id,
                title: `${s.name} ${s.surname}`,
                subtitle: s.class?.name || "No class",
                img: s.img,
                route: `/list/students/${s.username}`,
            })),
            ...teachers.map((t) => ({
                type: "lecturer" as const,
                id: t.id,
                title: `${t.name} ${t.surname}`,
                subtitle: "Lecturer",
                img: t.img,
                route: `/list/lecturers/${t.username}`,
            })),
            ...subjects.map((s) => ({
                type: "subject" as const,
                id: s.id.toString(),
                title: s.name,
                subtitle: `${s._count.lessons} lessons • ${s._count.teachers} lecturers`,
                img: null,
                route: `/list/courses?search=${encodeURIComponent(s.name)}`,
            })),
            ...lessons.map((l) => ({
                type: "lesson" as const,
                id: l.id.toString(),
                title: `${l.subject.name} - ${l.class.name}`,
                subtitle: `${l.day} • ${l.teacher.name} ${l.teacher.surname}`,
                img: null,
                route: `/list/lessons?search=${encodeURIComponent(l.subject.name)}`,
            })),
            ...classes.map((c) => ({
                type: "class" as const,
                id: c.id.toString(),
                title: c.name,
                subtitle: `${c._count.students} students${c.supervisor ? ` • ${c.supervisor.name} ${c.supervisor.surname}` : ""}`,
                img: null,
                route: `/list/attendance/${c.id}`,
            })),
        ];

        return NextResponse.json({ results, query }, { status: 200 });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
};
