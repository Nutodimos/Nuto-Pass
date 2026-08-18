import prisma from "@/lib/prisma";
import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Calendar, Clock, User, Users, Presentation } from "lucide-react";
import Link from "next/link";
import CourseSemesterFilter from "@/components/CourseSemesterFilter";

type LessonList = Lesson & {
  subject: { name: string };
  class: { name: string };
  teacher: { name: string; surname: string };
};

const LessonListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const { ...queryParams } = searchParams;

  // Fetch current semester setting
  const semesterConfig = await prisma.schoolConfig.findFirst({
    where: { key: "currentSemester" },
  });
  const currentSemester = semesterConfig?.value ? parseInt(semesterConfig.value) : 1;

  // QUERY GENERATION
  const query: Prisma.LessonWhereInput = {};
  query.isActive = true;

  // Semester filtering on lessons through subject
  const selectedSemesterParam = queryParams.semester;
  if (selectedSemesterParam === "all") {
    // Show all lessons across all semesters
  } else if (selectedSemesterParam && selectedSemesterParam !== "") {
    const semNum = parseInt(selectedSemesterParam);
    if (!isNaN(semNum)) {
      query.subject = {
        is: {
          OR: [
            { semester: semNum },
            { semester: null },
          ],
        },
      };
    }
  } else if (currentSemester && currentSemester !== 0) {
    query.subject = {
      is: {
        OR: [
          { semester: currentSemester },
          { semester: null },
        ],
      },
    };
  }

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "classId":
            query.classId = parseInt(value);
            break;
          case "teacherId":
            query.teacherId = value;
            break;
          case "subjectId":
            query.subjectId = parseInt(value);
            break;
          case "search":
            query.OR = [
              { subject: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { name: { contains: value, mode: "insensitive" } } },
              { teacher: { surname: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE FILTER
  if (role === "teacher") {
    query.teacherId = sessionClaims?.sub as string;
  } else if (role === "student") {
    const studentId = sessionClaims?.sub as string;
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: studentId },
      select: { subjectId: true },
    });
    const enrolledSubjectIds = enrollments.map((e: { subjectId: number }) => e.subjectId);

    query.subjectId = { in: enrolledSubjectIds };
  }

  // FETCH DATA - No Pagination, fetch all to show complete schedule
  const data = await prisma.lesson.findMany({
    where: query,
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true, surname: true } },
    },
  });

  // GROUP BY DAY
  const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

  const groupedLessons = daysOrder.reduce((acc, day) => {
    acc[day] = data
      .filter((lesson) => lesson.day === day)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return acc;
  }, {} as Record<string, LessonList[]>);

  // Helper format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex-1 m-4 mt-0">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-CPENavy via-CPENavyDark to-CPENavy rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Presentation className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Lesson Schedule</h1>
              <p className="text-white/70 text-sm">Full weekly timetable</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <CourseSemesterFilter currentSemester={String(currentSemester)} />
            <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <TableSearch />
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE LIST */}
      <div className="space-y-8 pb-10">
        {daysOrder.map((day) => {
          const lessons = groupedLessons[day];
          if (!lessons || lessons.length === 0) return null;

          return (
            <div key={day} className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                  {day}
                </span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="group cpe-card flex flex-col relative"
                  >
                    <div className="group cpe-card-indicator z-0"></div>

                    {/* The Full Card Link Layer - sits underneath actions */}
                    <Link
                      href={`/list/lessons/${lesson.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`View details for ${lesson.subject.name}`}
                    />

                    <div className="p-5 flex-1 flex flex-col relative z-20 pointer-events-none">
                      {/* HEADER: Subject & Time */}
                      <div className="flex justify-between items-start mb-3 pointer-events-auto">
                        <div className="flex-1 pointer-events-none">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-CPENavy transition-colors">
                            {lesson.subject.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-CPEGold" />
                            <span>
                              {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Higher z-index than Link Layer) */}
                        {role === "admin" && (
                          <div className="flex items-center gap-1 ml-2 relative z-30 pointer-events-auto">
                            <FormContainer table="lesson" type="update" data={lesson} />
                            <FormContainer table="lesson" type="delete" id={lesson.id} />
                          </div>
                        )}
                      </div>

                      {/* DETAILS: Class & Teacher */}
                      <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Level:</span>
                          </div>
                          <span className="font-semibold text-slate-700">{lesson.class.name}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Lecturer:</span>
                          </div>
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                            {lesson.teacher.name} {lesson.teacher.surname}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {Object.values(groupedLessons).every((l) => l.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Presentation className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No lessons scheduled</h3>
            <p className="text-sm text-slate-400">Try adjusting your semester or search filter</p>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {role === "admin" && (
        <div className="fixed bottom-24 md:bottom-8 right-8 z-50 group">
          <div className="relative">
            <div className="absolute inset-0 bg-CPEGold rounded-full animate-ping opacity-75"></div>
            <div className="relative">
              <FormContainer table="lesson" type="create" />
            </div>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                Add Lesson
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

export default LessonListPage;
