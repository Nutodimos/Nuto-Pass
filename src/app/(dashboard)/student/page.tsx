export const dynamic = "force-dynamic";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import { auth } from "@clerk/nextjs/server";
import { Day, Prisma } from "@prisma/client";
import Image from "next/image";
import { Clock, BookOpen, ClipboardList, CalendarDays, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const StudentPage = async () => {
  const { default: prisma } = await import("@/lib/prisma");
  const { userId } = auth();

  const student = await prisma.student.findUnique({
    where: { id: userId! },
    include: {
      class: true,
    },
  });

  const [enrollmentsList, assignmentsCount, attendanceRecords] = await Promise.all([
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
  ]);

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
    <div className="flex-1 p-4 flex gap-8 flex-col xl:flex-row bg-CPENavy/5 min-h-screen">
      {/* LEFT COLUMN */}
      <div className="w-full xl:w-2/3 flex flex-col gap-8">

        {/* HERO SECTION */}
        <div className="relative shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-CPENavy to-CPENavyDark p-8 shadow-xl shadow-CPENavy/10 border border-CPENavy/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full pointer-events-none filter blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-CPEGold/20 rounded-full pointer-events-none filter blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/10 p-1 flex items-center justify-center backdrop-blur-sm border border-white/20">
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
                <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wider">Welcome back,</p>
                <h1 className="text-3xl font-bold tracking-tight">{student?.name} {student?.surname}</h1>
              </div>
            </div>

            <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80 font-medium">Today is</p>
                <p className="text-lg font-bold text-white">
                  {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="flex flex-col md:flex-row gap-6 shrink-0">
          <Link href="/list/courses" className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-CPEGold/30 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Enrolled Courses</p>
              <h2 className="text-3xl font-bold text-CPENavyDark group-hover:text-CPEGold transition-colors">{enrolledCourseCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-CPEGold/10 flex items-center justify-center group-hover:bg-CPEGold/20 transition-colors">
              <BookOpen className="w-6 h-6 text-CPEGold" />
            </div>
          </Link>

          <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-CPENavy/30 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Attendance Rate</p>
              <h2 className="text-3xl font-bold text-CPENavyDark group-hover:text-CPENavy transition-colors">{attendanceRate}%</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-CPENavy/10 flex items-center justify-center group-hover:bg-CPENavy/20 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-CPENavy" />
            </div>
          </div>

          <Link href="/list/assignments" className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md hover:border-green-300 hover:-translate-y-1 transition-all group">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">Pending Assignments</p>
              <h2 className="text-3xl font-bold text-CPENavyDark group-hover:text-green-600 transition-colors">{assignmentsCount}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <ClipboardList className="w-6 h-6 text-green-500" />
            </div>
          </Link>
        </div>

        {/* CALENDAR SECTION */}
        <div className="flex-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-CPENavyDark">Your Schedule {student?.class && `(${student.class.name})`}</h1>
            <Link href="/list/lessons" className="text-sm font-medium text-CPENavy hover:underline flex items-center gap-1">
              View All Lessons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {student?.classId ? (
            <BigCalendarContainer type="classId" id={student.classId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No class assigned.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">

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

        <Announcements />
      </div>
    </div>
  );
};

export default StudentPage;
