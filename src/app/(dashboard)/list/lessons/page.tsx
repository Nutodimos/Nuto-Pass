import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Calendar, Clock, User, Users, Presentation } from "lucide-react";
import Link from "next/link";

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

  // QUERY GENERATION
  const query: Prisma.LessonWhereInput = {};
  query.isActive = true;

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
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // TEACHER FILTER
  if (role === "teacher") {
    query.teacherId = sessionClaims?.sub as string;
  }

  // FETCH DATA - No Pagination, fetch all to show complete schedule
  const data = await prisma.lesson.findMany({
    where: query,
    include: {
      subject: { select: { name: true } },
      class: { select: { name: true } },
      teacher: { select: { name: true, surname: true } },
    },
    // No take/skip - we want the full week's schedule
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
      <div className="bg-gradient-to-r from-nutoSlate via-nutoSlateDark to-nutoSlate rounded-2xl p-6 mb-8 shadow-lg">
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
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <TableSearch />
            </div>
            {role === "admin" && (
              <div className="bg-white/20 p-1 rounded-full hover:bg-white/30 transition-colors">
                <FormContainer table="lesson" type="create" />
              </div>
            )}
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
                    className="group nuto-card flex flex-col relative"
                  >
                    <div className="group nuto-card-indicator z-0"></div>

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
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 group-hover:text-nutoSlate transition-colors">
                            {lesson.subject.name}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium capitalize mb-2">
                            {lesson.name?.toLowerCase().startsWith('lesson') ? lesson.name.replace(/lesson/i, 'Lesson ') : lesson.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                          </div>
                        </div>
                      </div>

                      {/* DETAILS: Class & Teacher */}
                      <div className="space-y-2 pt-3 mt-auto border-t border-slate-50 block pointer-events-none">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="p-1.5 bg-slate-100 rounded-md text-slate-500 group-hover:bg-slate-200 transition-colors">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{lesson.class.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="p-1.5 bg-slate-100 rounded-md text-slate-500 group-hover:bg-slate-200 transition-colors">
                            <User className="w-4 h-4" />
                          </div>
                          <span>{lesson.teacher.name} {lesson.teacher.surname}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No lessons schedules found.</p>
            {role === "admin" && <p className="text-sm mt-2 text-nutoSlateUnderline">Try adding a new lesson.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonListPage;
