import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Prisma, Subject, Teacher } from "@prisma/client";
import { Users, BookOpen, GraduationCap, Mail, Phone, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type TeacherWithDetails = Teacher & {
  subjects: Subject[];
  classes: Class[];
  _count: { lessons: number };
};

const LecturersPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // Access control: Only admin can access this page
  if (role !== "admin") {
    redirect("/");
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.TeacherWhereInput = {
    isActive: true, // Hide soft-deleted teachers
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.lessons = {
              some: {
                classId: parseInt(value),
              },
            };
            break;
          case "subjectId":
            query.subjects = {
              some: {
                id: parseInt(value),
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

  const [data, count] = await prisma.$transaction([
    prisma.teacher.findMany({
      where: query,
      include: {
        subjects: true,
        classes: true,
        _count: { select: { lessons: true } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.teacher.count({ where: query }),
  ]);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">Lecturers</h1>
              <p className="text-white/80 text-sm">{count} lecturers available</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <TableSearch />
            </div>
            {role === "admin" && (
              <FormContainer table="teacher" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* LECTURERS GRID */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No lecturers found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((lecturer: TeacherWithDetails) => (
            <div
              key={lecturer.id}
              className="group nuto-card p-5 flex flex-col"
            >
              <div className="group nuto-card-indicator"></div>
              <Link href={`/list/lecturers/${lecturer.id}`} className="block flex-1 relative z-10">
                {/* Header with Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={lecturer.img || "/noAvatar.png"}
                      alt=""
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-nutoSlate transition-colors">
                      {lecturer.name} {lecturer.surname}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {lecturer.username}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-nutoSlate transition-colors" />
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {lecturer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4 text-nutoSlate" />
                      <span className="truncate">{lecturer.email}</span>
                    </div>
                  )}
                  {lecturer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4 text-nutoOrange" />
                      <span>{lecturer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Courses */}
                {lecturer.subjects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-nutoSlate" />
                      <span className="text-xs font-medium text-gray-500">Courses</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lecturer.subjects.slice(0, 3).map((subject) => (
                        <span
                          key={subject.id}
                          className="px-2 py-1 bg-nutoSlate/10 text-nutoSlate text-xs rounded-md"
                        >
                          {subject.name}
                        </span>
                      ))}
                      {lecturer.subjects.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                          +{lecturer.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <BookOpen className="w-4 h-4 text-nutoSlate" />
                    <span>{lecturer.subjects.length} Courses</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <GraduationCap className="w-4 h-4 text-nutoOrange" />
                    <span>{lecturer._count.lessons} Lessons</span>
                  </div>
                </div>
              </Link>

              {/* Admin Actions - Outside the Link */}
              {role === "admin" && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 relative z-10">
                  <FormContainer table="teacher" type="update" data={lecturer} />
                  <FormContainer table="teacher" type="delete" id={lecturer.id} />
                </div>
              )}
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

export default LecturersPage;
