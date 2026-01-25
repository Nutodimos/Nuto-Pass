import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import StudentPerformance from "@/components/StudentPerformance";
import AttendanceCalendarContainer from "@/components/AttendanceCalendarContainer";
import SubjectAttendanceSummary from "@/components/SubjectAttendanceSummary";
import prisma from "@/lib/prisma";
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

  const student:
    | (Student & {
      class: Class & {
        _count: { lessons: number; students: number };
        grade: Grade;
      };
    })
    | null = await prisma.student.findUnique({
      where: { id },
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

  // Get attendance stats
  const [totalAttendances, presentAttendances] = await prisma.$transaction([
    prisma.attendance.count({ where: { studentId: id } }),
    prisma.attendance.count({ where: { studentId: id, present: true } }),
  ]);

  const attendanceRate = totalAttendances > 0
    ? Math.round((presentAttendances / totalAttendances) * 100)
    : 0;

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* PROFILE CARD - Modern Nuto Theme */}
        <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-6">
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
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">
                  {student.name} {student.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="student" type="update" data={student} />
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-3 gap-4">
          {/* Attendance Rate Card */}
          <Link
            href={`/list/attendance?studentId=${student.id}`}
            className="bg-gradient-to-br from-nutoSlateLight/20 to-nutoSlate/10 p-5 rounded-2xl border border-nutoSlate/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-nutoSlate flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-nutoSlateDark">
                {attendanceRate}%
              </h3>
              <p className="text-sm text-nutoSlate">Attendance</p>
            </div>
          </Link>

          {/* Lessons Card */}
          <Link
            href={`/list/lessons?classId=${student.class.id}`}
            className="bg-gradient-to-br from-nutoOrangeLight/20 to-nutoOrange/10 p-5 rounded-2xl border border-nutoOrange/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-nutoOrange flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-nutoOrangeDark">
                {student.class._count.lessons}
              </h3>
              <p className="text-sm text-nutoOrange">Lessons</p>
            </div>
          </Link>

          {/* Class Card */}
          <div className="bg-gradient-to-br from-nutoSlate/10 to-nutoSlateLight/10 p-5 rounded-2xl border border-nutoSlate/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-nutoSlateLight flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-nutoSlateDark">
                {student.class.name}
              </h3>
              <p className="text-sm text-nutoSlate">Level {student.class.grade.level}</p>
            </div>
          </div>
        </div>

        {/* SCHEDULE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-[600px]">
          <h2 className="text-lg font-semibold text-nutoSlateDark mb-4">Schedule</h2>
          <BigCalendarContainer type="classId" id={student.class.id} />
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
              href={`/list/lessons?classId=${student.class.id}`}
            >
              Lessons
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-nutoOrange text-white text-sm font-medium hover:bg-nutoOrangeDark transition-colors"
              href={`/list/teachers?classId=${student.class.id}`}
            >
              Teachers
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-nutoSlateLight text-white text-sm font-medium hover:bg-nutoSlate transition-colors"
              href={`/list/assignments?classId=${student.class.id}`}
            >
              Assignments
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-nutoOrangeLight text-white text-sm font-medium hover:bg-nutoOrange transition-colors"
              href={`/list/attendance?studentId=${student.id}`}
            >
              Attendance
            </Link>
          </div>
        </div>

        {/* Performance */}
        <StudentPerformance studentId={student.id} />

        {/* Attendance Calendar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <AttendanceCalendarContainer studentId={student.id} />
        </div>

        {/* Subject Attendance Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <SubjectAttendanceSummary studentId={student.id} />
        </div>

        {/* Announcements */}
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
