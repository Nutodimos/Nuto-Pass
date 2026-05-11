import prisma from "@/lib/prisma";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import BiometricRegistrationButton from "@/components/BiometricRegistrationButton";
import CsvImportModal from "@/components/CsvImportModal";
import CollapsibleSection from "@/components/CollapsibleSection";

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
    <div key={student.id} className="group cpe-card flex flex-col">
      <div className="group cpe-card-indicator"></div>
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
            <h3 className="font-semibold text-gray-800 truncate group-hover:text-CPENavy transition-colors">
              {student.name}
            </h3>
            <p className="text-sm text-gray-500">{student.surname}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-CPENavy transition-colors" />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-CPENavy/10 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-CPENavy" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Matric No.</p>
              <p className="text-gray-700 font-medium truncate">{student.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-CPEGold/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-CPEGold" />
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
          <BiometricRegistrationButton studentId={student.id} hasBiometric={!!student.biometricId} />
        </div>
      )}
    </div>
  );

  // LECTURER DASHBOARD VIEW
  if (role === "teacher" && userId) {
    // 1. Fetch Level Advising info (class + students)
    const advisingClass = await prisma.class.findFirst({
      where: { supervisorId: userId },
      select: { id: true, name: true },
    });

    // Build search filter
    const searchFilter = searchParams.search
      ? {
        OR: [
          { name: { contains: searchParams.search, mode: "insensitive" as const } },
          { surname: { contains: searchParams.search, mode: "insensitive" as const } },
          { username: { contains: searchParams.search, mode: "insensitive" as const } },
        ],
      }
      : {};

    const advisingStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        class: { supervisorId: userId },
        ...searchFilter,
      },
      include: { class: true },
      orderBy: { name: "asc" },
    });

    // 2. Fetch courses taught by this lecturer with enrolled students
    const taughtSubjects = await prisma.subject.findMany({
      where: {
        teachers: { some: { id: userId } },
        isActive: true,
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // Fetch enrolled students for each subject
    const courseGroups: CourseGroup[] = [];
    for (const subject of taughtSubjects) {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          subjectId: subject.id,
          student: searchParams.search ? searchFilter : undefined,
        },
        include: {
          student: {
            include: { class: true },
          },
        },
        orderBy: { student: { name: "asc" } },
      });

      const students = enrollments
        .map((e: { student: StudentList }) => e.student)
        .filter((s: StudentList) => s.isActive);

      courseGroups.push({
        subject: { id: subject.id, name: subject.name },
        students,
      });
    }

    return (
      <div className="flex-1 p-4 flex flex-col gap-8">
        {/* HEADER */}
        <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
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

                <TableSearch />

            </div>
          </div>
        </div>

        {/* SECTION: LEVEL ADVISING */}
        {advisingClass && (
          <CollapsibleSection
            defaultOpen={true}
            title={
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-CPEGold" />
                <h2 className="text-xl font-bold text-CPENavyDark">Level Advising — {advisingClass.name}</h2>
                <span className="bg-CPEGold/10 text-CPEGold text-xs font-bold px-2.5 py-1 rounded-full">{advisingStudents.length}</span>
              </div>
            }
            action={
              <CsvImportModal
                mode="import-students"
                targetId={advisingClass.id}
                targetName={advisingClass.name}
              />
            }
          >
            {advisingStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {advisingStudents.map(student => <StudentCard key={student.id} student={student as StudentList} showActions={true} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 border border-slate-100 rounded-2xl w-full">
                <Users className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-base font-medium text-gray-500">No students yet</h3>
                <p className="text-sm text-gray-400">Import students using a CSV file</p>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* SECTION: COURSES */}
        {courseGroups.map(group => (
          <CollapsibleSection
            key={group.subject.id}
            defaultOpen={false}
            title={
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-CPENavy" />
                <h2 className="text-xl font-bold text-CPENavyDark">Course: {group.subject.name}</h2>
                <span className="bg-CPENavy/10 text-CPENavy text-xs font-bold px-2.5 py-1 rounded-full">{group.students.length}</span>
              </div>
            }
            action={
              <CsvImportModal
                mode="enroll-students"
                targetId={group.subject.id}
                targetName={group.subject.name}
              />
            }
          >
            {group.students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {group.students.map(student => <StudentCard key={student.id} student={student} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50 border border-slate-100 rounded-2xl w-full">
                <Users className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-base font-medium text-gray-500">No enrolled students</h3>
                <p className="text-sm text-gray-400">Enroll students using a CSV file</p>
              </div>
            )}
          </CollapsibleSection>
        ))}

        {!advisingClass && courseGroups.length === 0 && (
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
            query.OR = [
              { name: { contains: value, mode: "insensitive" } },
              { surname: { contains: value, mode: "insensitive" } },
              { username: { contains: value, mode: "insensitive" } },
            ];
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
      <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between gap-4">
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

              <TableSearch />

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

      {/* FLOATING ACTION BUTTON */}
      {(role === "admin" || role === "teacher") && (
        <div className="fixed bottom-24 md:bottom-8 right-8 z-50 group">
          <div className="relative">
            <div className="absolute inset-0 bg-CPEGold rounded-full animate-ping opacity-75"></div>
            <div className="relative">
              <FormContainer table="student" type="create" />
            </div>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                Add Student
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="border-8 border-transparent border-l-slate-800"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListPage;
