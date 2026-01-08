import prisma from "@/lib/prisma";
import AttendanceCalendar from "./AttendanceCalendar";
import { auth } from "@clerk/nextjs/server";

const AttendanceCalendarContainer = async ({ studentId }: { studentId: string }) => {
    const { sessionClaims, userId } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const whereClause: any = {
        studentId: studentId,
    };

    if (role === "teacher") {
        whereClause.lesson = {
            teacherId: userId
        }
    }

    const attendance = await prisma.attendance.findMany({
        where: whereClause,
        include: {
            lesson: {
                include: {
                    subject: true,
                },
            },
        },
        orderBy: {
            date: "desc",
        },
    });

    return (
        <div className="bg-white p-4 rounded-md h-full">
            <h2 className="text-xl font-semibold mb-4">Calendar</h2>
            <AttendanceCalendar attendance={attendance} />
        </div>
    );
};

export default AttendanceCalendarContainer;
