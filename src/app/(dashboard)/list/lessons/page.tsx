import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Class, Lesson, Prisma, Subject, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { BookOpen, Calendar, Clock, User, Users } from "lucide-react";

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
              <BookOpen className="w-8 h-8 text-white" />
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
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-nutoSlate/30 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="h-1 w-full absolute top-0 left-0 bg-slate-200 group-hover:bg-nutoSlate transition-colors duration-300"></div>

                    <div className="p-5">
                      {/* HEADER: Subject & Time */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{lesson.subject.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                          </div>
                        </div>
                        {/* ACTIONS */}
                        {role === "admin" && (
                          <div className="flex gap-2">
                            <FormContainer table="lesson" type="update" data={lesson} />
                            <FormContainer table="lesson" type="delete" id={lesson.id} />
                          </div>
                        )}
                      </div>

                      {/* DETAILS: Class & Teacher */}
                      <div className="space-y-2 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{lesson.class.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
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
