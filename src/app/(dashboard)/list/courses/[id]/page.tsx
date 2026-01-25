import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Users, Calendar, FileText, GraduationCap, Download, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleCoursePage = async ({
    params: { id },
}: {
    params: { id: string };
}) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const courseId = parseInt(id);

    if (isNaN(courseId)) {
        return notFound();
    }

    const course = await prisma.subject.findUnique({
        where: { id: courseId },
        include: {
            teachers: true,
            lessons: {
                include: {
                    class: { select: { name: true } },
                },
                take: 10,
            },
            materials: {
                include: {
                    teacher: { select: { name: true, surname: true } },
                    class: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: {
                    teachers: true,
                    lessons: true,
                    materials: true,
                },
            },
        },
    });

    if (!course) {
        return notFound();
    }

    return (
        <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
            {/* LEFT */}
            <div className="w-full xl:w-2/3 flex flex-col gap-4">
                {/* COURSE HEADER */}
                <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-white text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                {course.name}
                            </h1>
                            <p className="text-white/80 text-sm">
                                Course materials, lessons, and lecturers
                            </p>
                        </div>
                    </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Lecturers */}
                    <Link
                        href={`/list/lecturers?subjectId=${course.id}`}
                        className="bg-gradient-to-br from-nutoSlateLight/20 to-nutoSlate/10 p-5 rounded-2xl border border-nutoSlate/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-xl bg-nutoSlate flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-nutoSlateDark">
                                {course._count.teachers}
                            </h3>
                            <p className="text-sm text-nutoSlate">Lecturers</p>
                        </div>
                    </Link>

                    {/* Lessons */}
                    <Link
                        href={`/list/lessons?subjectId=${course.id}`}
                        className="bg-gradient-to-br from-nutoOrangeLight/20 to-nutoOrange/10 p-5 rounded-2xl border border-nutoOrange/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-xl bg-nutoOrange flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-nutoOrangeDark">
                                {course._count.lessons}
                            </h3>
                            <p className="text-sm text-nutoOrange">Lessons</p>
                        </div>
                    </Link>

                    {/* Materials */}
                    <Link
                        href={`/list/materials?subjectId=${course.id}`}
                        className="bg-gradient-to-br from-nutoSlate/10 to-nutoSlateLight/10 p-5 rounded-2xl border border-nutoSlate/10 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-xl bg-nutoSlateLight flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-nutoSlateDark">
                                {course._count.materials}
                            </h3>
                            <p className="text-sm text-nutoSlate">Materials</p>
                        </div>
                    </Link>
                </div>

                {/* LESSONS SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-nutoSlateDark">Lessons</h2>
                        <Link
                            href={`/list/lessons?subjectId=${course.id}`}
                            className="text-sm text-nutoSlate hover:text-nutoSlateDark"
                        >
                            View All →
                        </Link>
                    </div>

                    {course.lessons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <Calendar className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">No lessons scheduled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {course.lessons.map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-nutoSlate/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-nutoOrange/10 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-nutoOrange" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{lesson.name}</h3>
                                            <p className="text-xs text-gray-500">{lesson.class.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-nutoSlate/10 text-nutoSlate">
                                        {lesson.day.charAt(0) + lesson.day.slice(1).toLowerCase()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* MATERIALS SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-nutoSlateDark">Course Materials</h2>
                        <Link
                            href={`/list/materials?subjectId=${course.id}`}
                            className="text-sm text-nutoSlate hover:text-nutoSlateDark"
                        >
                            View All →
                        </Link>
                    </div>

                    {course.materials.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <FileText className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">No materials uploaded</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {course.materials.map((material) => (
                                <div
                                    key={material.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-nutoOrange/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-nutoSlate/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-nutoSlate" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{material.title}</h3>
                                            <p className="text-xs text-gray-500">
                                                {material.teacher?.name} {material.teacher?.surname} • {material.class.name}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={material.filePath}
                                        target="_blank"
                                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-nutoOrange text-white text-sm font-medium hover:bg-nutoOrangeDark transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden sm:inline">Download</span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT */}
            <div className="w-full xl:w-1/3 flex flex-col gap-4">
                {/* Quick Links */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-nutoSlateDark mb-4">Quick Links</h2>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            className="px-4 py-2 rounded-xl bg-nutoSlate text-white text-sm font-medium hover:bg-nutoSlateDark transition-colors"
                            href={`/list/lessons?subjectId=${course.id}`}
                        >
                            All Lessons
                        </Link>
                        <Link
                            className="px-4 py-2 rounded-xl bg-nutoOrange text-white text-sm font-medium hover:bg-nutoOrangeDark transition-colors"
                            href={`/list/materials?subjectId=${course.id}`}
                        >
                            All Materials
                        </Link>
                    </div>
                </div>

                {/* Lecturers */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-semibold text-nutoSlateDark mb-4">Lecturers</h2>

                    {course.teachers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                            <Users className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No lecturers assigned</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {course.teachers.map((teacher) => (
                                <Link
                                    key={teacher.id}
                                    href={`/list/lecturers/${teacher.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-nutoSlate/10 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-nutoSlate/20">
                                        <Image
                                            src={teacher.img || "/noAvatar.png"}
                                            alt=""
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-800">
                                            {teacher.name} {teacher.surname}
                                        </h3>
                                        <p className="text-xs text-gray-500">{teacher.email || "No email"}</p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SingleCoursePage;
