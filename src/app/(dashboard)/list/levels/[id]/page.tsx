export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users, BookOpen, User, Calendar, Clock, Check } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import FormContainer from "@/components/FormContainer";
import CsvImportModal from "@/components/CsvImportModal";

const LevelDetailsPage = async ({ params }: { params: { id: string } }) => {
    // 1. Fetch Class Data & Relations
    const levelId = parseInt(params.id);
    if (isNaN(levelId)) return notFound();

    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const userId = sessionClaims?.sub;

    const level = await prisma.class.findUnique({
        where: { id: levelId },
        include: {
            supervisor: true,
            grade: true,
            _count: {
                select: {
                    students: true,
                    lessons: true,
                }
            },
            lessons: {
                include: {
                    subject: true,
                    teacher: true,
                },
                orderBy: [
                    { day: 'asc' },
                    { startTime: 'asc' }
                ]
            }
        }
    });

    if (!level) return notFound();

    // 2. Fetch Aggregate Attendance Stats for this level's students
    // To calculate the overall average attendance for this level:
    // We get total attendances marked for students in this class, and count how many were 'present: true'.
    const attendanceStats = await prisma.attendance.aggregate({
        where: {
            student: {
                classId: levelId
            }
        },
        _count: {
            id: true // Total attendance records
        }
    });

    const presentStats = await prisma.attendance.aggregate({
        where: {
            student: {
                classId: levelId
            },
            present: true
        },
        _count: {
            id: true // Total records marked present
        }
    });

    const totalAttendanceRecords = attendanceStats._count.id;
    const totalPresentRecords = presentStats._count.id;
    const averageAttendance = totalAttendanceRecords > 0
        ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100)
        : 0;

    // Mapping Enums for display
    const daysMap: Record<string, string> = {
        MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday"
    };

    return (
        <div className="flex-1 p-4 flex flex-col gap-6 bg-[#F7F8FA] min-h-screen">
            {/* Header / Breadcrumb Area */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link href="/list/levels" className="hover:text-CPENavy transition-colors">Levels</Link>
                <span>/</span>
                <span className="font-semibold text-slate-800">{level.name}</span>
            </div>

            {/* SECTION 1: TOP DASHBOARD STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Level Profile Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl font-bold shadow-inner border border-white/10">
                                    {level.name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">{level.name}</h1>
                                    <p className="text-white/80 font-medium">{level.grade.level} Level &bull; {level._count.students} Students Enrolled</p>
                                </div>
                            </div>
                            {(role === "admin" || (role === "teacher" && sessionClaims?.sub === level.supervisorId)) && (
                                <div className="flex gap-2 items-center">
                                    <CsvImportModal mode="import-students" targetId={level.id} targetName={level.name} />
                                    {role === "admin" && (
                                        <>
                                            <FormContainer table="class" type="update" data={level} />
                                            <FormContainer table="class" type="delete" id={level.id} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Level Adviser Row */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 mt-auto">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20">
                                {level.supervisor?.img ? (
                                    <Image src={level.supervisor.img} alt="Adviser" width={48} height={48} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User className="w-6 h-6 text-white/50" /></div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-white/60 font-semibold uppercase tracking-wider mb-0.5">Level Adviser</p>
                                <p className="font-bold text-lg leading-tight">
                                    {level.supervisor ? `${level.supervisor.name} ${level.supervisor.surname}` : "Not Assigned"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Metric Widgets */}
                <Link href={`/list/students?classId=${level.id}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-CPEGold/10 text-CPEGold flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">+Active</div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-800 mb-1">{level._count.students}</h2>
                        <p className="text-slate-500 font-medium">Total Students</p>
                    </div>
                </Link>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                    {/* Progress ring background effect */}
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full border-[16px] border-emerald-50 opacity-50 group-hover:scale-110 transition-transform duration-500" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Check className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-end gap-1 mb-1">
                            <h2 className="text-4xl font-black text-slate-800">{averageAttendance}</h2>
                            <span className="text-2xl font-bold text-slate-500 mb-1">%</span>
                        </div>
                        <p className="text-slate-500 font-medium">Avg. Attendance</p>

                        {/* Progress Bar indicator */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${averageAttendance >= 75 ? 'bg-emerald-500' : averageAttendance >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${averageAttendance}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: COURSE TIMETABLE WIDGETS */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Course Timetable</h2>
                        <p className="text-sm text-slate-500">Scheduled {level._count.lessons} lessons for this semester.</p>
                    </div>
                </div>

                {level.lessons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {level.lessons.map((lesson) => (
                            <Link
                                href={`/list/lessons/${lesson.id}`}
                                key={lesson.id}
                                className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 hover:shadow-lg hover:border-CPENavy/30 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden"
                            >
                                {/* Interactive hover state gradient */}
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-CPENavy to-CPEGold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-CPENavy/10 group-hover:text-CPENavy transition-colors">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                        {daysMap[lesson.day]}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-lg leading-tight text-slate-800 mb-1 group-hover:text-CPENavy transition-colors line-clamp-2">
                                        {lesson.subject.name}
                                    </h3>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span className="font-semibold">
                                            {new Date(lesson.startTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-slate-400">-</span>
                                        <span className="font-semibold">
                                            {new Date(lesson.endTime).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-600 justify-end">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="truncate max-w-[80px]" title={`${lesson.teacher.name} ${lesson.teacher.surname}`}>
                                            {lesson.teacher.surname}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                        <Calendar className="w-16 h-16 text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Courses Scheduled</h3>
                        <p className="text-slate-500 max-w-md mx-auto">There are no lessons currently assigned to this level&apos;s timetable. Administrators can add lessons from the curriculum settings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LevelDetailsPage;
