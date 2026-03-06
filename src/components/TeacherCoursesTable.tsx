import { Subject, Teacher, Lesson } from "@prisma/client";
import Link from "next/link";
import { BookOpen, Users, ChevronLeft, ChevronRight } from "lucide-react";

type SubjectWithDetails = Subject & {
  teachers: Teacher[];
  _count: { lessons: number };
};

const ITEMS_PER_PAGE = 5;

interface TeacherCoursesTableProps {
  teacherId: string;
  page?: number;
  baseUrl: string;
}

const TeacherCoursesTable = async ({
  teacherId,
  page = 1,
  baseUrl,
}: TeacherCoursesTableProps) => {
  const { default: prisma } = await import("@/lib/prisma");
  const [courses, count] = await prisma.$transaction([
    prisma.subject.findMany({
      where: {
        teachers: {
          some: {
            id: teacherId,
          },
        },
      },
      include: {
        teachers: true,
        _count: {
          select: { lessons: true },
        },
      },
      take: ITEMS_PER_PAGE,
      skip: ITEMS_PER_PAGE * (page - 1),
    }),
    prisma.subject.count({
      where: {
        teachers: {
          some: {
            id: teacherId,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">No courses found for this lecturer</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Course Name</th>
              <th className="pb-3 font-medium hidden md:table-cell">
                Lessons
              </th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course: SubjectWithDetails) => (
              <tr
                key={course.id}
                className="border-b border-gray-50 hover:bg-CPENavy/5 transition-colors"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-CPENavy/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-CPENavy" />
                    </div>
                    <span className="font-medium text-gray-800">
                      {course.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 hidden md:table-cell">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{course._count.lessons} lessons</span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <Link
                    href={`/list/lessons?subjectId=${course.id}&teacherId=${teacherId}`}
                    className="text-sm text-CPENavy hover:text-CPENavyDark font-medium"
                  >
                    View Lessons →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(page * ITEMS_PER_PAGE, count)} of {count}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={hasPrev ? `${baseUrl}?coursesPage=${page - 1}` : "#"}
              className={`p-2 rounded-lg border ${
                hasPrev
                  ? "border-gray-200 hover:bg-gray-50 text-gray-600"
                  : "border-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <span className="text-sm font-medium text-gray-600 px-2">
              {page} / {totalPages}
            </span>
            <Link
              href={hasNext ? `${baseUrl}?coursesPage=${page + 1}` : "#"}
              className={`p-2 rounded-lg border ${
                hasNext
                  ? "border-gray-200 hover:bg-gray-50 text-gray-600"
                  : "border-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesTable;
