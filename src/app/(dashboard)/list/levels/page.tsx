import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Grade, Prisma, Teacher } from "@prisma/client";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Layers, Users, User, BookOpen } from "lucide-react";

type ClassList = Class & {
  supervisor: Teacher | null;
  grade: Grade;
  _count: {
    students: number;
    lessons: number;
  };
};

const ClassListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.ClassWhereInput = {
    isActive: true, // Hide archived classes
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "supervisorId":
            query.supervisorId = value;
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

  // TEACHER FILTER: Only show classes where the teacher has lessons
  if (role === "teacher") {
    query.lessons = {
      some: {
        teacherId: sessionClaims?.sub as string
      }
    };
  }

  const [data, count] = await prisma.$transaction([
    prisma.class.findMany({
      where: query,
      include: {
        supervisor: true,
        grade: true,
        _count: {
          select: {
            students: true,
            lessons: true,
          }
        }
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.class.count({ where: query }),
  ]);



  return (
    <div className="flex-1 m-4 mt-0">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-nutoSlate via-nutoSlateDark to-nutoSlate rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Academic Levels</h1>
              <p className="text-white/70 text-sm">{count} levels available</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <TableSearch />
            </div>
            {role === "admin" && <FormContainer table="class" type="create" />}
          </div>
        </div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((level, index) => (
          <Link
            key={level.id}
            href={`/list/levels/${level.id}`}
            className="group"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:border-nutoSlate/30 transition-all duration-300 hover:-translate-y-1">
              {/* Level Header */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-nutoSlate to-nutoSlateDark flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{level.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-nutoSlateDark group-hover:text-nutoSlate transition-colors">{level.name}</h2>
                    <p className="text-slate-500 text-sm">Academic Year 2024/2025</p>
                  </div>
                </div>
              </div>

              {/* Level Stats */}
              <div className="p-5">
                {/* Adviser */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {level.supervisor?.img ? (
                      <Image
                        src={level.supervisor.img}
                        alt=""
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Level Adviser</p>
                    <p className="font-semibold text-gray-800">
                      {level.supervisor
                        ? `${level.supervisor.name} ${level.supervisor.surname}`
                        : "Not Assigned"}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-nutoSlateDark">{level._count.students}</p>
                    <p className="text-xs text-slate-500">Students</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-nutoSlateDark">{level._count.lessons}</p>
                    <p className="text-xs text-slate-500">Lessons</p>
                  </div>
                </div>

                {/* Actions */}
                {role === "admin" && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <FormContainer table="class" type="update" data={level} />
                    <FormContainer table="class" type="delete" id={level.id} />
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Levels Found</h3>
          <p className="text-slate-400">Try adjusting your search or create a new level.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default ClassListPage;
