import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Teacher, Grade } from "@prisma/client";
import { Users, GraduationCap, UserCheck, ChevronRight, ClipboardCheck, BookOpen, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AttendanceCalendarContainer from "@/components/AttendanceCalendarContainer";
import SubjectAttendanceSummary from "@/components/SubjectAttendanceSummary";

type ClassWithDetails = Class & {
    supervisor: Teacher | null;
    grade: Grade;
    _count: { students: number };
};

type SubjectWithDetails = {
    id: number;
    name: string;
    isActive: boolean;
    _count: { enrollments: number };
};

const AttendanceClassListPage = async ({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) => {
    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    const { sessionClaims, userId } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    if (!role || !currentUserId) {
        redirect("/");
    }

    // ========== STUDENT VIEW: My Attendance ==========
    if (role === "student") {
        const student = await prisma.student.findUnique({
            where: { id: currentUserId },
            include: {
                class: true
            }
        });

        const attendanceRecords = await prisma.attendance.findMany({
            where: { studentId: currentUserId },
        });

        const totalLessons = attendanceRecords.length;
        const presentCount = attendanceRecords.filter((record) => record.present).length;
        const absentCount = totalLessons - presentCount;
        const attendanceRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 100;

        return (
            <div className="flex-1 p-4 flex flex-col gap-6 bg-slate-50/50 min-h-screen">
                {/* HERO BANNER */}
                <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-8 rounded-3xl shadow-lg relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full pointer-events-none filter blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex flex-col items-center justify-center backdrop-blur-sm border border-white/20">
                                <UserCheck className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-white">
                                <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
                                <p className="text-white/80 font-medium mt-1">
                                    {student?.class?.name || "Unassigned"}
                                </p>
                            </div>
                        </div>

                        {/* QUICK STATS IN BANNER */}
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[120px]">
                                <p className="text-sm text-white/80 font-medium mb-1">Overall Rate</p>
                                <p className="text-3xl font-bold text-white">{attendanceRate}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETAILED STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Total Lessons</p>
                            <h2 className="text-3xl font-bold text-slate-800">{totalLessons}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-slate-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Present</p>
                            <h2 className="text-3xl font-bold text-emerald-600">{presentCount}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Absent</p>
                            <h2 className="text-3xl font-bold text-rose-600">{absentCount}</h2>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-rose-500" />
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT: CALENDAR & SUBJECT BREAKDOWN */}
                <div className="flex flex-col xl:flex-row gap-6">
                    {/* LEFT COLUMN: Calendar */}
                    <div className="w-full xl:w-2/3 flex flex-col">
                        <AttendanceCalendarContainer studentId={currentUserId} />
                    </div>

                    {/* RIGHT COLUMN: Subject Breakdown */}
                    <div className="w-full xl:w-1/3 flex flex-col">
                        <SubjectAttendanceSummary studentId={currentUserId} />
                    </div>
                </div>
            </div>
        );
    }

    // ========== TEACHER VIEW: Show Courses ==========
    if (role === "teacher" && currentUserId) {
        // Build search filter
        const searchFilter = queryParams.search
            ? { name: { contains: queryParams.search, mode: "insensitive" as const } }
            : {};

        const [subjects, subjectCount] = await prisma.$transaction([
            prisma.subject.findMany({
                where: {
                    teachers: { some: { id: currentUserId } },
                    isActive: true,
                    ...searchFilter,
                },
                include: {
                    teachers: {
                        select: { id: true, name: true, surname: true, img: true },
                    },
                    _count: {
                        select: { enrollments: true },
                    },
                },
                orderBy: { name: "asc" },
                take: ITEM_PER_PAGE,
                skip: ITEM_PER_PAGE * (p - 1),
            }),
            prisma.subject.count({
                where: {
                    teachers: { some: { id: currentUserId } },
                    isActive: true,
                    ...searchFilter,
                },
            }),
        ]);

        return (
            <div className="flex-1 p-4 flex flex-col gap-4">
                {/* HEADER */}
                <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                                <ClipboardCheck className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-white">
                                <h1 className="text-2xl font-bold">Attendance</h1>
                                <p className="text-white/80 text-sm">Select a course to manage attendance</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 rounded-xl px-4 py-2">
                                <TableSearch />
                            </div>
                        </div>
                    </div>
                </div>

                {/* COURSES GRID */}
                {subjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
                        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-500">No courses found</h3>
                        <p className="text-sm text-gray-400">You have no assigned courses yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((subject: any) => (
                            <Link
                                key={subject.id}
                                href={`/list/attendance/course/${subject.id}`}
                                className="group cpe-card p-5 block"
                            >
                                <div className="group cpe-card-indicator"></div>
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-CPEGold to-CPEGoldDark flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-CPEGold transition-colors" />
                                </div>

                                {/* Course Name */}
                                <h3 className="text-xl font-semibold text-gray-800 mb-1 group-hover:text-CPEGold transition-colors">
                                    {subject.name}
                                </h3>

                                {/* Stats */}
                                <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Users className="w-4 h-4 text-CPENavy" />
                                        <span>{subject._count.enrollments} Enrolled</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* PAGINATION */}
                <div className="bg-white rounded-2xl p-2">
                    <Pagination page={p} count={subjectCount} />
                </div>
            </div>
        );
    }

    // ========== ADMIN VIEW: Show Classes (original) ==========
    const query: any = {};

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.name = { contains: value, mode: "insensitive" };
                        break;
                }
            }
        }
    }

    const [data, count] = await prisma.$transaction([
        prisma.class.findMany({
            where: query,
            include: {
                supervisor: true,
                grade: true,
                _count: { select: { students: true } },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.class.count({ where: query }),
    ]);

    return (
        <div className="flex-1 p-4 flex flex-col gap-4">
            {/* HEADER */}
            <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                            <ClipboardCheck className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-bold">Attendance</h1>
                            <p className="text-white/80 text-sm">Select a class to manage attendance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 rounded-xl px-4 py-2">
                            <TableSearch />
                        </div>
                    </div>
                </div>
            </div>

            {/* CLASSES GRID */}
            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
                    <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">No classes found</h3>
                    <p className="text-sm text-gray-400">Try adjusting your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((classItem: ClassWithDetails) => (
                        <Link
                            key={classItem.id}
                            href={`/list/attendance/${classItem.id}`}
                            className="group cpe-card p-5 block"
                        >
                            <div className="group cpe-card-indicator"></div>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-CPEGold to-CPEGoldDark flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-CPEGold transition-colors" />
                            </div>

                            {/* Class Name */}
                            <h3 className="text-xl font-semibold text-gray-800 mb-1 group-hover:text-CPEGold transition-colors">
                                {classItem.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Level {classItem.grade.level}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="w-4 h-4 text-CPENavy" />
                                    <span>{classItem._count.students} Students</span>
                                </div>
                            </div>

                            {/* Supervisor */}
                            {classItem.supervisor && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                        <Image
                                            src={classItem.supervisor.img || "/noAvatar.png"}
                                            alt=""
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Level Adviser</p>
                                        <p className="text-sm font-medium text-gray-700">
                                            {classItem.supervisor.name} {classItem.supervisor.surname}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}

            {/* PAGINATION */}
            <div className="bg-white rounded-2xl p-2">
                <Pagination page={p} count={count} />
            </div>
        </div>
    );
};

export default AttendanceClassListPage;
