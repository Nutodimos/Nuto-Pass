export const dynamic = "force-dynamic";
import AttendanceList from "@/components/AttendanceList";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Announcements from "@/components/Announcements";
import { BookOpen, Calendar, Clock, User, Users } from "lucide-react";
import FormContainer from "@/components/FormContainer";
import LessonAttendanceCalendarContainer from "@/components/LessonAttendanceCalendarContainer";

const SingleLessonPage = async ({
    params: { id },
}: {
    params: { id: string };
}) => {
  const { default: prisma } = await import("@/lib/prisma");
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = sessionClaims?.sub; // User ID from Clerk

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(id) },
        include: {
            subject: true,
            teacher: true,
            class: {
                include: {
                    students: {
                        orderBy: { surname: "asc" },
                    },
                },
            },
        },
    });

    if (!lesson) {
        return notFound();
    }

    // Attendance Logic
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.findMany({
        where: {
            lessonId: lesson.id,
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        select: {
            studentId: true,
            present: true,
        },
    });

    // Formatting 
    const formatTime = (dateString: Date) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const startTime = new Date(lesson.startTime);
    const endTime = new Date(lesson.endTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    return (
        <div className="flex-1 p-6 flex flex-col gap-6 xl:flex-row bg-[#F7F8FA] min-h-full">
            {/* LEFT COLUMN - Main Content */}
            <div className="w-full xl:w-2/3 flex flex-col gap-6">

                {/* --- HERO HEADER CARD --- */}
                <div className="cpe-card relative bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start group z-10 w-full min-h-max">
                    {/* Fancy background gradients - contained in their own layer so they don't clip the card content */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-CPEGold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-CPENavy/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
                    </div>
                    <div className="cpe-card-indicator z-20" />

                    {/* Lesson Icon/Image */}
                    <div className="relative w-28 h-28 shrink-0 rounded-2xl bg-gradient-to-br from-CPENavy to-slate-800 p-[3px] shadow-lg z-10">
                        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden relative">
                            <BookOpen className="w-12 h-12 text-CPENavy absolute opacity-10" />
                            <div className="flex flex-col items-center z-10">
                                <span className="text-4xl font-black text-CPENavy leading-none">{lesson.subject.name.substring(0, 1).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left z-10 relative w-full">
                        {/* Status/Day Badge */}
                        <div className="flex w-full items-center justify-between mb-3">
                            <span className="px-3 py-1 bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap">
                                {lesson.day}
                            </span>
                            {role === "admin" && (
                                <div className="flex gap-2 isolate z-50">
                                    <FormContainer table="lesson" type="update" data={lesson} />
                                    <FormContainer table="lesson" type="delete" id={lesson.id} />
                                </div>
                            )}
                        </div>

                        {/* Title - Removing meaningless "Lesson format" and using Subject */}
                        <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-2 break-words">
                            {lesson.subject.name}
                        </h1>

                        <p className="text-slate-500 font-semibold text-base mb-6 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Lecturer: {lesson.teacher.name} {lesson.teacher.surname}
                        </p>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                            <Link href={`/list/levels/${lesson.classId}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-CPENavy transition-colors rounded-lg border border-slate-200 font-semibold text-sm">
                                <Users className="w-4 h-4 text-CPENavy" />
                                Level {lesson.class.name}
                            </Link>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 font-semibold text-sm">
                                <Clock className="w-4 h-4 text-CPEGold" />
                                {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- QUICK STATS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="cpe-card flex-col md:flex-row p-5 flex items-center md:items-center justify-center md:justify-start gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Students</p>
                            <h2 className="text-2xl font-black text-slate-800 leading-none">{lesson.class.students.length}</h2>
                        </div>
                        <div className="cpe-card-indicator bg-gradient-to-r from-blue-500 to-blue-400" />
                    </div>

                    <div className="cpe-card flex-col md:flex-row p-5 flex items-center md:items-center justify-center md:justify-start gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-CPEGold/10 text-CPEGold flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                            <h2 className="text-2xl font-black text-slate-800 leading-none">{durationMinutes} <span className="text-sm font-semibold text-slate-500">mins</span></h2>
                        </div>
                        <div className="cpe-card-indicator bg-gradient-to-r from-CPEGold to-CPEGoldDark" />
                    </div>

                    <div className="cpe-card flex-col md:flex-row p-5 flex items-center md:items-center justify-center md:justify-start gap-4 group">
                        <div className="w-12 h-12 rounded-full bg-CPENavy/10 text-CPENavy flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Schedule</p>
                            <h2 className="text-xl font-black text-slate-800 capitalize leading-none pt-1">{lesson.day.toLowerCase()}</h2>
                        </div>
                        <div className="cpe-card-indicator bg-gradient-to-r from-CPENavy to-slate-800" />
                    </div>
                </div>

                {/* --- ATTENDANCE SECTION --- */}
                {(role === "admin" || (role === "teacher" && lesson.teacherId === currentUserId)) && (
                    <div className="cpe-card p-6 md:p-8 flex flex-col gap-6 w-full">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Attendance Roster</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Mark student presence for today&apos;s session</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>

                        {/* polished container */}
                        <div className="w-full relative z-10">
                            <AttendanceList
                                lessonId={lesson.id}
                                students={lesson.class.students}
                                initialAttendance={attendance}
                                role={role}
                            />
                        </div>
                        <div className="cpe-card-indicator z-0" />
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN - Sidebar */}
            <div className="w-full xl:w-1/3 flex flex-col gap-6">

                {/* --- QUICK LINKS CARD --- */}
                <div className="cpe-card p-6 border-l-4 border-l-CPEGold">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-CPEGold" />
                        Quick Links
                    </h3>
                    <div className="flex flex-col gap-3">
                        <Link
                            href={`/list/lecturers/${lesson.teacherId}`}
                            className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                        >
                            <span className="font-semibold text-slate-700 text-sm">Lecturer Profile</span>
                            <User className="w-4 h-4 text-slate-400 group-hover:text-CPENavy" />
                        </Link>
                        <Link
                            href={`/list/levels/${lesson.classId}`}
                            className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group"
                        >
                            <span className="font-semibold text-slate-700 text-sm">Full Level Roster</span>
                            <Users className="w-4 h-4 text-slate-400 group-hover:text-CPENavy" />
                        </Link>
                        <Link
                            href={`/list/courses/${lesson.subjectId}`}
                            className="flex justify-between items-center p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors group relative pointer-events-none opacity-60"
                            title="Feature coming soon"
                        >
                            <span className="font-semibold text-slate-700 text-sm">Course Syllabus</span>
                            <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-CPENavy" />
                            <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Soon</span>
                        </Link>
                    </div>
                    <div className="cpe-card-indicator" />
                </div>

                {/* --- HISTORICAL ATTENDANCE CALENDAR --- */}
                <LessonAttendanceCalendarContainer lessonId={lesson.id} />

                {/* Announcements */}
                <Announcements />

                {/* Help/Support Card */}
                <div className="cpe-card p-6 bg-gradient-to-br from-slate-800 to-CPENavy text-white border-0 mt-auto shadow-lg shadow-CPENavy/20">
                    <h3 className="font-bold text-lg mb-2 text-white">Need Help?</h3>
                    <p className="text-slate-300 text-sm mb-5 font-medium leading-relaxed">
                        If you encounter any issues marking attendance, please contact technical support.
                    </p>
                    <Link href="/contact" className="inline-block w-full text-center px-4 py-3 bg-white hover:bg-slate-100 text-CPENavy rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95">
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SingleLessonPage;
