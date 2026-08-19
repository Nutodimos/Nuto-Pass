import prisma from "@/lib/prisma";
import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import StudentPerformance from "@/components/StudentPerformance";
import AttendanceCalendarContainer from "@/components/AttendanceCalendarContainer";
import SubjectAttendanceSummary from "@/components/SubjectAttendanceSummary";
import { auth } from "@clerk/nextjs/server";
import { Class, Student, Grade } from "@prisma/client";
import { Mail, Phone, Droplets, Calendar, BookOpen, GraduationCap, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleStudentPage = async ({
  params: { id },
}: {
  params: { id: string };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Look up by matric number (username) for cleaner URLs
  const student:
    | (Student & {
      class: Class & {
        _count: { lessons: number; students: number };
        grade: Grade;
      };
    })
    | null = await prisma.student.findUnique({
      where: { username: id },
      include: {
        class: {
          include: {
            _count: { select: { lessons: true, students: true } },
            grade: true,
          }
        },
      },
    });

  if (!student || !student.isActive) {
    return notFound();
  }

  // Get attendance stats using the actual student ID
  const [totalAttendances, presentAttendances] = await prisma.$transaction([
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.attendance.count({ where: { studentId: student.id, present: true } }),
  ]);

  const attendanceRate = totalAttendances > 0
    ? Math.round((presentAttendances / totalAttendances) * 100)
    : 0;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* TOP DESKTOP ROW (2 Columns) */}
      <div className="flex flex-col gap-4 xl:flex-row">
        
        {/* LEFT COLUMN */}
        <div className="w-full xl:w-2/3 flex flex-col gap-4">
          
          {/* COMPACT PROFILE CARD */}
          <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-4 md:p-6 rounded-2xl shadow-lg">
            <div className="flex flex-row gap-4 items-center md:items-start text-left">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-white/20 p-1">
                  <Image
                    src={student.img || "/noAvatar.png"}
                    alt=""
                    width={112}
                    height={112}
                    className="w-full h-full rounded-xl object-cover bg-white"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-white min-w-0">
                <div className="flex flex-row items-start md:items-center justify-between gap-2 mb-2 md:mb-4">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-bold truncate">
                        {student.name} {student.surname}
                      </h1>
                      {student.class?.name?.toLowerCase().includes("spill") && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-200 border border-amber-400/40">
                          Spillover
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-white/80 font-medium truncate">Matric: {student.username}</span>
                  </div>
                  {role === "admin" && (
                    <div className="hidden md:block shrink-0">
                      <FormContainer table="student" type="update" data={student} />
                    </div>
                  )}
                </div>

                {/* Contact Info - Horizontal Scrollable on Mobile */}
                <div className="flex overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:pb-0 hide-scrollbar gap-2 md:grid md:grid-cols-2 lg:grid-cols-4 w-full text-left mt-2 md:mt-4">
                  <div className="flex-shrink-0 flex items-center gap-2 text-xs md:text-sm text-white/90 bg-white/10 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none">
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <Mail className="w-3.5 h-3.5 md:hidden text-white shrink-0" />
                    <span className="truncate max-w-[150px] md:max-w-none">{student.email || "-"}</span>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2 text-xs md:text-sm text-white/90 bg-white/10 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none">
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <Phone className="w-3.5 h-3.5 md:hidden text-white shrink-0" />
                    <span>{student.phone || "-"}</span>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2 text-xs md:text-sm text-white/90 bg-white/10 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none">
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                      <Droplets className="w-4 h-4 text-white" />
                    </div>
                    <Droplets className="w-3.5 h-3.5 md:hidden text-white shrink-0" />
                    <span>{student.bloodType || "-"}</span>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2 text-xs md:text-sm text-white/90 bg-white/10 md:bg-transparent px-3 py-1.5 md:p-0 rounded-full md:rounded-none">
                    <div className="hidden md:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <Calendar className="w-3.5 h-3.5 md:hidden text-white shrink-0" />
                    <span>{student.birthday ? new Intl.DateTimeFormat("en-GB").format(student.birthday) : "-"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Admin Action Button (moved below profile on small screens) */}
            {role === "admin" && (
              <div className="mt-4 md:hidden w-full flex justify-end">
                <FormContainer table="student" type="update" data={student} />
              </div>
            )}
          </div>

          {/* MOBILE QUICK LINKS (Elevated, hidden on desktop) */}
          <div className="xl:hidden group cpe-card p-4">
            <div className="group cpe-card-indicator"></div>
            <h2 className="text-sm font-semibold text-CPENavyDark mb-3 relative z-10 uppercase tracking-wider">Quick Actions</h2>
            <div className="flex overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar gap-2 relative z-10">
              <Link className="flex-shrink-0 px-4 py-2 rounded-xl bg-CPENavy text-white text-sm font-medium hover:bg-CPENavyDark transition-colors" href={`/list/lessons?classId=${student.class.id}`}>Lessons</Link>
              <Link className="flex-shrink-0 px-4 py-2 rounded-xl bg-CPEGold text-white text-sm font-medium hover:bg-CPEGoldDark transition-colors" href={`/list/lecturers?classId=${student.class.id}`}>Lecturers</Link>
              <Link className="flex-shrink-0 px-4 py-2 rounded-xl bg-CPESlate text-white text-sm font-medium hover:bg-CPENavy transition-colors" href={`/list/assignments?classId=${student.class.id}`}>Assignments</Link>
              <Link className="flex-shrink-0 px-4 py-2 rounded-xl bg-CPEGoldLight text-white text-sm font-medium hover:bg-CPEGold transition-colors" href={`/list/attendance?studentId=${student.id}`}>Attendance</Link>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link href={`/list/attendance?studentId=${student.id}`} className="bg-gradient-to-br from-CPESlate/20 to-CPENavy/10 p-4 rounded-2xl border border-CPENavy/20 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-CPENavy flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-CPENavyDark">{attendanceRate}%</h3>
                <p className="text-xs sm:text-sm text-CPENavy">Attendance</p>
              </div>
            </Link>

            <Link href={`/list/lessons?classId=${student.class.id}`} className="bg-gradient-to-br from-CPEGoldLight/20 to-CPEGold/10 p-4 rounded-2xl border border-CPEGold/20 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-CPEGold flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-CPEGoldDark">{student.class._count.lessons}</h3>
                <p className="text-xs sm:text-sm text-CPEGold">Lessons</p>
              </div>
            </Link>

            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-CPENavy/10 to-CPESlate/10 p-4 rounded-2xl border border-CPENavy/10 flex flex-row items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-CPESlate flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-CPENavyDark line-clamp-1">{student.class.name}</h3>
                <p className="text-xs sm:text-sm text-CPENavy">Level {student.class.grade.level}</p>
              </div>
            </div>
          </div>
          
          {/* MOBILE ACADEMICS (Elevated, moved from right column on mobile) */}
          <div className="xl:hidden flex flex-col gap-4">
            <StudentPerformance studentId={student.id} />
            <div className="group cpe-card p-5">
              <div className="group cpe-card-indicator"></div>
              <div className="relative z-10">
                <SubjectAttendanceSummary studentId={student.id} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          
          {/* DESKTOP QUICK LINKS (Hidden on mobile) */}
          <div className="hidden xl:block group cpe-card p-5">
            <div className="group cpe-card-indicator"></div>
            <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Quick Links</h2>
            <div className="flex flex-wrap gap-2 relative z-10">
              <Link className="px-4 py-2 rounded-xl bg-CPENavy text-white text-sm font-medium hover:bg-CPENavyDark transition-colors" href={`/list/lessons?classId=${student.class.id}`}>Lessons</Link>
              <Link className="px-4 py-2 rounded-xl bg-CPEGold text-white text-sm font-medium hover:bg-CPEGoldDark transition-colors" href={`/list/lecturers?classId=${student.class.id}`}>Lecturers</Link>
              <Link className="px-4 py-2 rounded-xl bg-CPESlate text-white text-sm font-medium hover:bg-CPENavy transition-colors" href={`/list/assignments?classId=${student.class.id}`}>Assignments</Link>
              <Link className="px-4 py-2 rounded-xl bg-CPEGoldLight text-white text-sm font-medium hover:bg-CPEGold transition-colors" href={`/list/attendance?studentId=${student.id}`}>Attendance</Link>
            </div>
          </div>

          {/* DESKTOP ACADEMICS (Hidden on mobile since they are elevated left) */}
          <div className="hidden xl:flex flex-col gap-4">
            <StudentPerformance studentId={student.id} />
            <div className="group cpe-card p-5">
              <div className="group cpe-card-indicator"></div>
              <div className="relative z-10">
                <SubjectAttendanceSummary studentId={student.id} />
              </div>
            </div>
          </div>

          {/* Attendance Calendar (Both mobile and desktop) */}
          <div className="group cpe-card p-5">
            <div className="group cpe-card-indicator"></div>
            <div className="relative z-10">
              <AttendanceCalendarContainer studentId={student.id} />
            </div>
          </div>
          
          {/* Announcements - Hidden on mobile, visible on desktop */}
          <div className="hidden xl:block">
            <Announcements />
          </div>        </div>
      </div>

      {/* BOTTOM FULL-WIDTH: SCHEDULE CALENDAR */}
      {/* Pushed to the bottom so it doesn't block critical stats on mobile */}
      <div className="w-full">
        <div className="group cpe-card p-4 md:p-6 h-[400px] md:h-[600px] flex flex-col overflow-hidden">
          <div className="group cpe-card-indicator"></div>
          <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Schedule</h2>
          <div className="relative z-10 flex-1 overflow-auto">
            <BigCalendarContainer type="classId" id={student.class.id} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default SingleStudentPage;
