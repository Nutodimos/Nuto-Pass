import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Teacher, Grade } from "@prisma/client";
import { Users, GraduationCap, UserCheck, ChevronRight, ClipboardCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

type ClassWithDetails = Class & {
    supervisor: Teacher | null;
    grade: Grade;
    _count: { students: number };
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

    const query: any = {};

    if (role === "teacher") {
        query.OR = [
            { supervisorId: currentUserId },
            { lessons: { some: { teacherId: currentUserId } } },
        ];
    }

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
            <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
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
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-lg transition-all hover:scale-[1.02] group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nutoOrange to-nutoOrangeDark flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-nutoOrange transition-colors" />
                            </div>

                            {/* Class Name */}
                            <h3 className="text-xl font-semibold text-gray-800 mb-1 group-hover:text-nutoOrange transition-colors">
                                {classItem.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Level {classItem.grade.level}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Users className="w-4 h-4 text-nutoSlate" />
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
