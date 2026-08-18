import prisma from "@/lib/prisma";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { auth } from "@clerk/nextjs/server";
import { Day, Prisma } from "@prisma/client";
import Image from "next/image";
import { Clock, BookOpen, ClipboardList, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import LoadingSkeleton from "@/components/LoadingSkeleton";

const StudentPage = async () => {
  const { userId } = auth();

  const student = await prisma.student.findUnique({
    where: { id: userId! },
    include: {
      class: true,
    },
  });

  const [enrollmentsList, assignmentsCount, attendanceRecords, sessionConfig, semesterConfig] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { studentId: userId! },
      select: { subjectId: true },
    }),
    prisma.assignment.count({
      where: {
        subject: {
          enrollments: {
            some: { studentId: userId! },
          },
        },
        dueDate: { gt: new Date() }, // Only pending assignments
      },
    }),
    prisma.attendance.findMany({
      where: { studentId: userId! },
      select: { present: true },
    }),
    prisma.schoolConfig.findFirst({ where: { key: "sessionYear" } }),
    prisma.schoolConfig.findFirst({ where: { key: "currentSemester" } }),
  ]);

  const sessionYear = sessionConfig?.value || "2024/25";
  const currentSemester = semesterConfig?.value || "1";
  const semesterText = currentSemester === "1" ? "Harmattan Semester" : "Rain Semester";

  const enrolledCourseCount = enrollmentsList.length;

  const totalAttendance = attendanceRecords.length;
  const presentAttendance = attendanceRecords.filter((a: { present: boolean }) => a.present).length;
  const attendanceRate = totalAttendance > 0
    ? Math.round((presentAttendance / totalAttendance) * 100)
    : 100;

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const days: Day[] = [Day.MONDAY, Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY, Day.MONDAY]; // 0 and 6 are dummy padded
  const currentDayName = days[dayOfWeek];

  // Fetch today's lessons for this student
  type LessonWithRelations = Prisma.LessonGetPayload<{
    include: { subject: true; class: true; teacher: true };
  }>;

  const todaysLessons: LessonWithRelations[] = isWeekend ? [] : await prisma.lesson.findMany({
    where: {
      classId: student?.classId,
      subject: {
        enrollments: {
          some: { studentId: userId! }
        }
      },
      day: currentDayName,
      isActive: true,
    },
    include: {
      subject: true,
      class: true,
      teacher: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return (
    <div className="flex-1 p-3 md:p-4 flex gap-4 md:gap-8 flex-col xl:flex-row bg-CPENavy/5 min-h-screen">
      {/* LEFT COLUMN */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4 md:gap-8">

        {/* HERO SECTION */}
        <div className="relative shrink-0 overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-CPENavy to-CPENavyDark p-4 md:p-8 shadow-xl shadow-CPENavy/10 border border-CPENavy/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full pointer-events-none filter blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-CPEGold/20 rounded-full pointer-events-none filter blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/10 p-1 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  <Image
                    src={student?.img || "/noAvatar.png"}
                    alt="Student Profile"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="text-white">
                <p className="text-white/80 text-xs md:text-sm font-medium mb-0.5 md:mb-1 uppercase tracking-wider">Welcome back,</p>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">{student?.name} {student?.surname}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
                    <CalendarDays className="w-3.5 h-3.5 text-CPEGold" />
                    Session: {sessionYear}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-CPEGold/25 text-amber-200 text-xs font-semibold backdrop-blur-sm border border-CPEGold/40">
                    <BookOpen className="w-3.5 h-3.5 text-CPEGold" />
                    {semesterText}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <div className="p-2.5 bg-CPEGold/20 rounded-xl border border-CPEGold/30">
                  <BookOpen className="w-5 h-5 text-CPEGold" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Academic Term</p>
                  <p className="text-sm font-bold text-white">{sessionYear} • {semesterText}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/70 font-medium">Today is</p>
                  <p className="text-sm font-bold text-white">
                    {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 shrink-0">
          <Link href="/list/courses" className="flex-1 bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-CPEGold/30 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1">Enrolled Courses</p>
              <h2 className="text-2xl md:text-3xl font-bold text-CPENavyDark group-hover:text-CPEGold transition-colors">{enrolledCourseCount}</h2>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-CPEGold/10 flex items-center justify-center group-hover:bg-CPEGold/20 transition-colors">
              <BookOpen className="w-6 h-6 text-CPEGold" />
            </div>
          </Link>

          <div className="flex-1 bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-CPENavy/30 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1">Attendance Rate</p>
              <h2 className="text-2xl md:text-3xl font-bold text-CPENavyDark group-hover:text-CPENavy transition-colors">{attendanceRate}%</h2>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-CPENavy/10 flex items-center justify-center group-hover:bg-CPENavy/20 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-CPENavy" />
            </div>
          </div>

          <Link href="/list/assignments" className="col-span-2 md:col-span-1 bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-green-300 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-xs md:text-sm font-semibold text-gray-500 mb-0.5 md:mb-1">Pending Assignments</p>
              <h2 className="text-2xl md:text-3xl font-bold text-CPENavyDark group-hover:text-green-600 transition-colors">{assignmentsCount}</h2>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <ClipboardList className="w-6 h-6 text-green-500" />
            </div>
          </Link>
        </div>

        {/* CALENDAR SECTION */}
        <div className="hidden md:block flex-1 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 min-h-[350px] md:min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-CPENavyDark">Your Schedule {student?.class && `(${student.class.name})`}</h1>
            <Link href="/list/lessons" className="text-sm font-medium text-CPENavy hover:underline flex items-center gap-1">
              View All Lessons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {student?.classId ? (
            <Suspense fallback={<LoadingSkeleton type="calendar" />}>
              <BigCalendarContainer type="classId" id={student.classId} />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No class assigned.
            </div>
          )}
        </div>

        {/* MOBILE CALENDAR SHORTCUT */}
        <div className="md:hidden flex-1 shrink-0">
          <Link href="/list/lessons" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-CPENavy/30 hover:-translate-y-1 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-CPENavy/10 flex items-center justify-center group-hover:bg-CPENavy/20 transition-colors">
                <CalendarDays className="w-6 h-6 text-CPENavy" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-CPENavyDark group-hover:text-CPENavy transition-colors">View Schedule</h2>
                <p className="text-xs font-medium text-gray-500">{student?.class ? `Class ${student.class.name}` : "Check lessons"}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-CPENavy/10 transition-colors">
              <ArrowRight className="w-4 h-4 text-CPENavy" />
            </div>
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4 md:gap-8">

        {/* TODAY'S LESSONS WIDGET */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-CPENavyDark">Today&apos;s Classes</h1>
            <div className="w-8 h-8 rounded-full bg-CPENavy/10 flex items-center justify-center text-CPENavy font-bold text-sm">
              {todaysLessons.length}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {todaysLessons.length > 0 ? (
              todaysLessons.map((lesson) => (
                <div key={lesson.id} className="flex gap-4 items-start p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-CPENavy/30 transition-all group">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white border border-gray-200 shrink-0 shadow-sm group-hover:shadow group-hover:border-CPENavy/30 transition-all">
                    <span className="text-xs font-bold text-gray-500">
                      {lesson.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="font-bold text-gray-800 text-sm">{lesson.subject.name}</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-CPENavy/10 text-CPENavy">
                        {lesson.teacher.name} {lesson.teacher.surname}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {lesson.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {" - "}
                        {lesson.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-gray-800 font-bold mb-1">No classes today!</h3>
                <p className="text-sm text-gray-500">Enjoy your free time.</p>
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS WIDGET */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-lg font-bold text-CPENavyDark mb-4">Quick Actions</h1>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/list/lessons" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-900">My Schedule</span>
            </Link>
            <Link href="/list/assignments" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-orange-900">Due Assignments</span>
            </Link>
          </div>
        </div>

        <Suspense fallback={<LoadingSkeleton type="announcements" />}>
          <Announcements />
        </Suspense>
      </div>
    </div>
  );
};

export default StudentPage;
