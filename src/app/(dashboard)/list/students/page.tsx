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
  ChevronRight,
  BookOpen
} from "lucide-react";

type StudentList = Student & { class: Class };

type LevelAdvisingStudent = StudentList;
type CourseGroup = {
  subject: { id: number; name: string };
  students: StudentList[];
};

const StudentListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const userId = sessionClaims?.sub;

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  // UI Component for rendering a Student Card
  const StudentCard = ({ student, showActions = false }: { student: StudentList, showActions?: boolean }) => (
    <div key={student.id} className="group nuto-card flex flex-col">
      <div className="group nuto-card-indicator"></div>
      <Link href={`/list/students/${student.username}`} className="block flex-1 relative z-10">
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

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-nutoSlate/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-nutoSlate" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Matric No.</p>
              <p className="text-gray-700 font-medium truncate">{student.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-nutoOrange/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-nutoOrange" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Level</p>
              <p className="text-gray-700 font-medium truncate">{student.class.name}</p>
            </div>
          </div>
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
        </div>
      </Link>

      {/* Card Footer - Actions (outside the link) */}
      {(role === "admin" || showActions) && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 relative z-10">
          <FormContainer table="student" type="update" data={student} />
          {role === "admin" && <FormContainer table="student" type="delete" id={student.id} />}
          <BiometricRegistrationButton studentId={student.id} />
        </div>
      )}
    </div>
  );

  // LECTURER DASHBOARD VIEW
  if (role === "teacher" && userId) {
    // 1. Fetch Level Advising Students
    const advisingStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        class: { supervisorId: userId },
      },
      include: { class: true },
      orderBy: { name: "asc" },
    });

    // 2. Fetch students for courses taught by this lecturer
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: userId, isActive: true },
      include: {
        subject: true,
        class: {
          include: {
            students: {
              where: { isActive: true },
              include: { class: true },
              orderBy: { name: "asc" },
            }
          }
        }
      }
    });

    // Group students by Subject
    const courseGroupsMap = new Map<number, CourseGroup>();

    lessons.forEach(lesson => {
      if (!courseGroupsMap.has(lesson.subjectId)) {
        courseGroupsMap.set(lesson.subjectId, {
          subject: lesson.subject,
          students: []
        });
      }

      const group = courseGroupsMap.get(lesson.subjectId)!;
      // Add students from this class, avoiding duplicates if multiple lessons share the same class
      lesson.class.students.forEach(student => {
        if (!group.students.some(s => s.id === student.id)) {
          group.students.push(student as StudentList);
        }
      });
    });

    // Sort students within each group and sort groups alphabetically
    const courseGroups = Array.from(courseGroupsMap.values())
      .map(group => {
        group.students.sort((a, b) => a.name.localeCompare(b.name));
        return group;
      })
      .sort((a, b) => a.subject.name.localeCompare(b.subject.name));

    return (
      <div className="flex-1 p-4 flex flex-col gap-8">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-nutoSlate to-nutoSlateDark p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div className="text-white text-center md:text-left">
                <h1 className="text-2xl font-bold">My Students</h1>
                <p className="text-white/80 text-sm">Grouped by Level Advising and Courses</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-xl px-4 py-2">
                <TableSearch />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: LEVEL ADVISING */}
        {advisingStudents.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b-2 border-nutoOrange/30 pb-2">
              <GraduationCap className="w-6 h-6 text-nutoOrange" />
              <h2 className="text-xl font-bold text-nutoSlateDark">Level Advising</h2>
              <span className="bg-nutoOrange/10 text-nutoOrange text-xs font-bold px-2.5 py-1 rounded-full">{advisingStudents.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {advisingStudents.map(student => <StudentCard key={student.id} student={student as StudentList} showActions={true} />)}
            </div>
          </div>
        )}

        {/* SECTION: COURSES */}
        {courseGroups.map(group => (
          group.students.length > 0 && (
            <div key={group.subject.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b-2 border-nutoSlate/30 pb-2">
                <BookOpen className="w-6 h-6 text-nutoSlate" />
                <h2 className="text-xl font-bold text-nutoSlateDark">Course: {group.subject.name}</h2>
                <span className="bg-nutoSlate/10 text-nutoSlate text-xs font-bold px-2.5 py-1 rounded-full">{group.students.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.students.map(student => <StudentCard key={student.id} student={student} />)}
              </div>
            </div>
          )
        ))}

        {advisingStudents.length === 0 && courseGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No students assigned to you yet</h3>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT ADMIN AND GLOBAL VIEW
  const query: Prisma.StudentWhereInput = {
    isActive: true, // Hide soft-deleted students
  };

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
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
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500">No students found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((student: StudentList) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
        <Pagination page={p} count={count} />
      </div>
    </div>
  );
};

export default StudentListPage;
