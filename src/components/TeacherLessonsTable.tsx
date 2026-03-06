import { Lesson } from "@prisma/client";
import Link from "next/link";
import { Calendar, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

type LessonWithDetails = Lesson & {
    subject: { id: number; name: string };
    class: { id: number; name: string };
};

const ITEMS_PER_PAGE = 5;

const dayColors: Record<string, string> = {
    MONDAY: "bg-blue-100 text-blue-700",
    TUESDAY: "bg-green-100 text-green-700",
    WEDNESDAY: "bg-purple-100 text-purple-700",
    THURSDAY: "bg-orange-100 text-orange-700",
    FRIDAY: "bg-pink-100 text-pink-700",
};

interface TeacherLessonsTableProps {
    teacherId: string;
    page?: number;
    baseUrl: string;
}

const TeacherLessonsTable = async ({
    teacherId,
    page = 1,
    baseUrl,
}: TeacherLessonsTableProps) => {
  const { default: prisma } = await import("@/lib/prisma");
    const [lessons, count] = await prisma.$transaction([
        prisma.lesson.findMany({
            where: {
                teacherId: teacherId,
                isActive: true,
            },
            include: {
                subject: { select: { name: true, id: true } },
                class: { select: { name: true, id: true } },
            },
            orderBy: [
                { day: "asc" },
                { startTime: "asc" },
            ],
            take: ITEMS_PER_PAGE,
            skip: ITEMS_PER_PAGE * (page - 1),
        }),
        prisma.lesson.count({
            where: {
                teacherId: teacherId,
                isActive: true,
            },
        }),
    ]);

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).format(date);
    };

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No lessons found for this lecturer</p>
            </div>
        );
    }

    return (
        <div>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                            <th className="pb-3 font-medium">Course</th>
                            <th className="pb-3 font-medium hidden sm:table-cell">Class</th>
                            <th className="pb-3 font-medium hidden md:table-cell">Day</th>
                            <th className="pb-3 font-medium hidden lg:table-cell">Time</th>
                            <th className="pb-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lessons.map((lesson: LessonWithDetails) => (
                            <tr
                                key={lesson.id}
                                className="border-b border-gray-50 hover:bg-CPEGold/5 transition-colors"
                            >
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-CPEGold/10 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-CPEGold" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-800 block">
                                                {lesson.subject.name}
                                            </span>
                                            <span className="text-xs text-gray-500 sm:hidden">
                                                {lesson.class.name}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 hidden sm:table-cell">
                                    <span className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                                        {lesson.class.name}
                                    </span>
                                </td>
                                <td className="py-4 hidden md:table-cell">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${dayColors[lesson.day] || "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {lesson.day.charAt(0) + lesson.day.slice(1).toLowerCase()}
                                    </span>
                                </td>
                                <td className="py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {formatTime(lesson.startTime)} -{" "}
                                            {formatTime(lesson.endTime)}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <Link
                                        href={`/list/attendance?lessonId=${lesson.id}`}
                                        className="text-sm text-CPEGold hover:text-CPEGoldDark font-medium"
                                    >
                                        Attendance →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
                        {Math.min(page * ITEMS_PER_PAGE, count)} of {count}
                    </span>
                    <div className="flex items-center gap-2">
                        <Link
                            href={hasPrev ? `${baseUrl}?lessonsPage=${page - 1}` : "#"}
                            className={`p-2 rounded-lg border ${hasPrev
                                ? "border-gray-200 hover:bg-gray-50 text-gray-600"
                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-sm font-medium text-gray-600 px-2">
                            {page} / {totalPages}
                        </span>
                        <Link
                            href={hasNext ? `${baseUrl}?lessonsPage=${page + 1}` : "#"}
                            className={`p-2 rounded-lg border ${hasNext
                                ? "border-gray-200 hover:bg-gray-50 text-gray-600"
                                : "border-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherLessonsTable;
