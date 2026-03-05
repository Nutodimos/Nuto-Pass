import Announcements from "@/components/Announcements";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import FormContainer from "@/components/FormContainer";
import TeacherPerformance from "@/components/TeacherPerformance";
import TeacherCoursesTable from "@/components/TeacherCoursesTable";
import TeacherLessonsTable from "@/components/TeacherLessonsTable";
import TeachingOverviewTabs from "@/components/TeachingOverviewTabs";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Teacher } from "@prisma/client";
import { BookOpen, Calendar, Mail, Phone, Droplets } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleTeacherPage = async ({
  params: { id },
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const teacher:
    | (Teacher & {
      _count: { subjects: number; lessons: number };
    })
    | null = await prisma.teacher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subjects: true,
            lessons: true,
          },
        },
      },
    });

  if (!teacher) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-4">
        {/* PROFILE CARD - CPE Theme */}
        <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white/20 p-1">
                <Image
                  src={teacher.img || "/noAvatar.png"}
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
                  {teacher.name} {teacher.surname}
                </h1>
                {role === "admin" && (
                  <FormContainer table="teacher" type="update" data={teacher} />
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span className="truncate">{teacher.email || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <span>{teacher.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-white" />
                  </div>
                  <span>{teacher.bloodType || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span>
                    {teacher.birthday ? new Intl.DateTimeFormat("en-GB").format(teacher.birthday) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 gap-4">
          {/* Courses Card */}
          <Link href={`/list/courses?teacherId=${teacher.id}`} className="bg-gradient-to-br from-CPESlate/20 to-CPENavy/10 p-5 rounded-2xl border border-CPENavy/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-CPENavy flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-CPENavyDark">
                {teacher._count.subjects}
              </h3>
              <p className="text-sm text-CPENavy">Courses</p>
            </div>
          </Link>

          {/* Lessons Card */}
          <Link href={`/list/lessons?teacherId=${teacher.id}`} className="bg-gradient-to-br from-CPEGoldLight/20 to-CPEGold/10 p-5 rounded-2xl border border-CPEGold/20 flex items-center gap-4 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-CPEGold flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-CPEGoldDark">
                {teacher._count.lessons}
              </h3>
              <p className="text-sm text-CPEGold">Lessons</p>
            </div>
          </Link>
        </div>

        {/* TEACHING OVERVIEW - Courses & Lessons Tables */}
        <TeachingOverviewTabs
          coursesCount={teacher._count.subjects}
          lessonsCount={teacher._count.lessons}
          coursesContent={
            <TeacherCoursesTable
              teacherId={teacher.id}
              page={searchParams.coursesPage ? parseInt(searchParams.coursesPage) : 1}
              baseUrl={`/list/lecturers/${teacher.id}`}
            />
          }
          lessonsContent={
            <TeacherLessonsTable
              teacherId={teacher.id}
              page={searchParams.lessonsPage ? parseInt(searchParams.lessonsPage) : 1}
              baseUrl={`/list/lecturers/${teacher.id}`}
            />
          }
        />

        {/* SCHEDULE */}
        <div className="group cpe-card p-6 h-[600px] flex flex-col">
          <div className="group cpe-card-indicator"></div>
          <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Schedule</h2>
          <div className="relative z-10 flex-1">
            <BigCalendarContainer type="teacherId" id={teacher.id} />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Shortcuts */}
        <div className="group cpe-card p-5">
          <div className="group cpe-card-indicator"></div>
          <h2 className="text-lg font-semibold text-CPENavyDark mb-4 relative z-10">Quick Links</h2>
          <div className="flex flex-wrap gap-2 relative z-10">
            <Link
              className="px-4 py-2 rounded-xl bg-CPENavy text-white text-sm font-medium hover:bg-CPENavyDark transition-colors"
              href={`/list/lessons?teacherId=${teacher.id}`}
            >
              Lessons
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPEGold text-white text-sm font-medium hover:bg-CPEGoldDark transition-colors"
              href={`/list/students?teacherId=${teacher.id}`}
            >
              Students
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPESlate text-white text-sm font-medium hover:bg-CPENavy transition-colors"
              href={`/list/assignments?teacherId=${teacher.id}`}
            >
              Assignments
            </Link>
            <Link
              className="px-4 py-2 rounded-xl bg-CPEGoldLight text-white text-sm font-medium hover:bg-CPEGold transition-colors"
              href={`/list/materials?teacherId=${teacher.id}`}
            >
              Materials
            </Link>
          </div>
        </div>

        {/* Performance */}
        <TeacherPerformance teacherId={teacher.id} />

        {/* Announcements */}
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
