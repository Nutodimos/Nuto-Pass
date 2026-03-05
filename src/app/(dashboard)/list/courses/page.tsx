import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import CsvImportModal from "@/components/CsvImportModal";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma, Subject, Teacher } from "@prisma/client";
import { BookOpen, Users, Calendar, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

type SubjectWithCounts = Subject & {
  teachers: Teacher[];
  _count: {
    lessons: number;
    materials: number;
    enrollments: number;
  };
};

const CoursesPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const userId = sessionClaims?.sub;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // Fetch current semester setting
  const semesterConfig = await prisma.schoolConfig.findUnique({
    where: { key: "currentSemester" },
  });
  const currentSemester = semesterConfig?.value ? parseInt(semesterConfig.value) : null;

  // URL PARAMS CONDITION
  const query: Prisma.SubjectWhereInput = {
    isActive: true, // Hide archived courses
  };

  // Filter by semester: show courses for current semester OR courses marked for both (null)
  if (currentSemester && currentSemester !== 0) {
    query.OR = [
      { semester: currentSemester },
      { semester: null }, // Both/Full year courses always show
    ];
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.teachers = {
              some: {
                id: value,
              },
            };
            break;
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS
  if (role === "teacher") {
    query.teachers = { some: { id: userId! } };
  } else if (role === "student") {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: userId! },
      select: { subjectId: true }
    });
    const enrolledIds = enrollments.map((e: { subjectId: number }) => e.subjectId);

    query.id = { in: enrolledIds };
  }


  const [data, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: query,
      include: {
        teachers: true,
        _count: {
          select: {
            lessons: true,
            materials: true,
            enrollments: true,
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.subject.count({ where: query }),
  ]);

  let allStudents: any[] = [];
  if (role === "admin" || role === "teacher") {
    allStudents = await prisma.student.findMany({
      select: { id: true, name: true, surname: true, username: true },
      where: { isActive: true },
      orderBy: { name: "asc" }
    });
  }

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Courses</h1>
              <p className="text-white/80 text-sm">{count} courses available</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <TableSearch />
            </div>
            {role === "admin" && (
              <FormContainer table="subject" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* COURSES GRID */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No courses found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((course: SubjectWithCounts) => (
            <div
              key={course.id}
              className="group cpe-card p-5 flex flex-col"
            >
              <div className="group cpe-card-indicator"></div>
              <Link href={`/list/courses/${course.id}`} className="block flex-1 relative z-10">
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-CPENavy transition-colors" />
                </div>

                {/* Course Name */}
                <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-CPENavy transition-colors">
                  {course.name}
                </h3>

                {/* Lecturers */}
                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {course.teachers.length > 0
                    ? course.teachers.map((t) => `${t.name} ${t.surname}`).join(", ")
                    : "No lecturers assigned"}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="w-4 h-4 text-CPENavy" />
                    <span>{course._count.enrollments} Enrolled</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Calendar className="w-4 h-4 text-CPEGold" />
                    <span>{course._count.lessons} Lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <FileText className="w-4 h-4 text-CPESlate" />
                    <span>{course._count.materials}</span>
                  </div>
                </div>
              </Link>

              {/* Actions — Outside the Link */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 relative z-10">
                {/* CSV Enroll for admins OR lecturers who teach this course */}
                {(role === "admin" || (role === "teacher" && course.teachers.some((t: Teacher) => t.id === userId))) && (
                  <>
                    <CsvImportModal
                      mode="enroll-students"
                      targetId={course.id}
                      targetName={course.name}
                      students={allStudents}
                    />
                  </>
                )}
                {role === "admin" && (
                  <>
                    <FormContainer table="subject" type="update" data={course} />
                    <FormContainer table="subject" type="delete" id={course.id} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="bg-white rounded-2xl p-2">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default CoursesPage;
