import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import BiometricRegistrationButton from "@/components/BiometricRegistrationButton";

import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Class, Prisma, Student } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  GraduationCap,
  Phone,
  MapPin,
  Hash,
  Eye,
  Users,
  ChevronRight
} from "lucide-react";

type StudentList = Student & { class: Class };

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION
  const query: Prisma.StudentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "teacherId":
            query.class = {
              lessons: {
                some: {
                  teacherId: value,
                },
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
    prisma.student.findMany({
      where: query,
      include: {
        class: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where: query }),
  ]);

  return (
    <div className="flex-1 p-4 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div className="text-white text-center md:text-left">
              <h1 className="text-2xl font-bold">Students</h1>
              <p className="text-white/80 text-sm">{count} students enrolled</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <TableSearch />
            </div>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="student" type="create" />
            )}
          </div>
        </div>
      </div>

      {/* STUDENTS GRID */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No students found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((student: StudentList) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Clickable Card Content */}
              <Link href={`/list/students/${student.username}`} className="block">
                {/* Card Header with Avatar */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={student.img || "/noAvatar.png"}
                      alt={student.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate group-hover:text-nutoSlate transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500">{student.surname}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-nutoSlate transition-colors" />
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Matric Number */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-nutoSlate/10 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4 text-nutoSlate" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Matric No.</p>
                      <p className="text-gray-700 font-medium truncate">{student.username}</p>
                    </div>
                  </div>

                  {/* Class/Level */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-nutoOrange/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-nutoOrange" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Level</p>
                      <p className="text-gray-700 font-medium truncate">{student.class.name}</p>
                    </div>
                  </div>

                  {/* Phone (if available) */}
                  {student.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-gray-700 font-medium truncate">{student.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Address (if available) */}
                  {student.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="text-gray-700 font-medium truncate">{student.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Link>

              {/* Card Footer - Actions (outside the link) */}
              {role === "admin" && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                  <FormContainer table="student" type="update" data={student} />
                  <FormContainer table="student" type="delete" id={student.id} />
                  <BiometricRegistrationButton studentId={student.id} />
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

export default StudentListPage;
