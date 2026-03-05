import prisma from "@/lib/prisma";
import LessonAttendanceCalendar from "./LessonAttendanceCalendar";

const LessonAttendanceCalendarContainer = async ({ lessonId }: { lessonId: number }) => {
    // Fetch all attendance records for this lesson
    const attendanceRecords = await prisma.attendance.findMany({
        where: {
            lessonId: lessonId,
        },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    username: true,
                }
            }
        },
        orderBy: {
            date: "desc",
        },
    });

    // We need to group these records by Date to calculate class %
    // The grouping logic will be handled inside the client component for interactivity.

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-CPENavyDark">Historical Attendance</h2>
            </div>
            <div className="flex-1 flex flex-col relative z-10">
                <LessonAttendanceCalendar attendance={attendanceRecords} lessonId={lessonId} />
            </div>
        </div>
    );
};

export default LessonAttendanceCalendarContainer;
