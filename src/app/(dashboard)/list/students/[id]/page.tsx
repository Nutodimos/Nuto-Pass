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

  if (!student) {
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
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* PROFILE CARD - Modern CPE Theme */}
        <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white/20 p-1">
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
            <div className="flex-1 text-white w-full">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">
                  {student.name} {student.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={student} />
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span className="truncate">{student.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <span>{student.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <span>{student.bloodType || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span>
                    {new Intl.DateTimeFormat("en-GB").format(student.birthday)}
                  </span>
                </div>
              </div>

              {/* Matric Number */}
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">Matric No: {student.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Attendance Rate Card */}
          <Link
            href={`/list/attendance?studentId=${student.id}`}
            className="bg-gradient-to-br from-CPESlate/20 to-CPENavy/10 p-5 rounded-2xl border border-CPENavy/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-CPENavy flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-CPENavyDark">
                {attendanceRate}%
              </h3>
              <p className="text-sm text-CPENavy">Attendance</p>
            </div>
          </Link>

          {/* Lessons Card */}
          <Link
            href={`/list/lessons?classId=${student.class.id}`}
            className="bg-gradient-to-br from-CPEGoldLight/20 to-CPEGold/10 p-5 rounded-2xl border border-CPEGold/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-CPEGold flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-CPEGoldDark">
                {student.class._count.lessons}
              </h3>
              <p className="text-sm text-CPEGold">Lessons</p>
            </div>
          </Link>

          {/* Class Card */}
          <div className="bg-gradient-to-br from-CPENavy/10 to-CPESlate/10 p-5 rounded-2xl border border-CPENavy/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-CPESlate flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-CPENavyDark">
                {student.class.name}
              </h3>
              <p className="text-sm text-CPENavy">Level {student.class.grade.level}</p>
            </div>
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="group cpe-card p-6 h-[400px] md:h-[600px] flex flex-col">
          <div className="group cpe-card-indicator"></div>
          <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Schedule</h2>
          <div className="relative z-10 flex-1">
            <BigCalendarContainer type="classId" id={student.class.id} />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Quick Links */}
        <div className="group cpe-card p-5">
          <div className="group cpe-card-indicator"></div>
          <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Quick Links</h2>
          <div className="flex flex-wrap gap-2 relative z-10">
            <Link
              className="px-4 py-2 rounded-xl bg-CPENavy text-white text-sm font-medium hover:bg-CPENavyDark transition-colors"
              href={`/list/lessons?classId=${student.class.id}`}
            >
              Lessons
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPEGold text-white text-sm font-medium hover:bg-CPEGoldDark transition-colors"
              href={`/list/lecturers?classId=${student.class.id}`}
            >
              Lecturers
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPESlate text-white text-sm font-medium hover:bg-CPENavy transition-colors"
              href={`/list/assignments?classId=${student.class.id}`}
            >
              Assignments
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPEGoldLight text-white text-sm font-medium hover:bg-CPEGold transition-colors"
              href={`/list/attendance?studentId=${student.id}`}
            >
              Attendance
            </Link>
          </div>
        </div>

        {/* Performance */}
        <StudentPerformance studentId={student.id} />

        {/* Attendance Calendar */}
        <div className="group cpe-card p-5">
          <div className="group cpe-card-indicator"></div>
          <div className="relative z-10">
            <AttendanceCalendarContainer studentId={student.id} />
          </div>
        </div>

        {/* Subject Attendance Summary */}
        <div className="group cpe-card p-5">
          <div className="group cpe-card-indicator"></div>
          <div className="relative z-10">
            <SubjectAttendanceSummary studentId={student.id} />
          </div>
        </div>

        {/* Announcements */}
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
