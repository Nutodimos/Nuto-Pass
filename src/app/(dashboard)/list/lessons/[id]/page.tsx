import AttendanceList from "@/components/AttendanceList";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BigCalendarContainer from "@/components/BigCalendarContainer";
import Announcements from "@/components/Announcements";

const SingleLessonPage = async ({
    params: { id },
}: {
    params: { id: string };
}) => {
    const { sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = sessionClaims?.sub; // User ID from Clerk

    const lesson = await prisma.lesson.findUnique({
        where: { id: parseInt(id) },
        include: {
            subject: true,
            teacher: true,
            class: {
                include: {
                    students: {
                        orderBy: { surname: "asc" },
                    },
                },
            },
        },
    });

    if (!lesson) {
        return notFound();
    }

    // Attendance Logic
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.findMany({
        where: {
            lessonId: lesson.id,
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        select: {
            studentId: true,
            present: true,
        },
    });

    return (
        <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
            {/* LEFT */}
            <div className="w-full xl:w-2/3">
                {/* TOP */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* USER INFO CARD */}
                    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
                        <div className="w-1/3">
                            <Image
                                src="/singleLesson.png"
                                alt=""
                                width={144}
                                height={144}
                                className="w-36 h-36 rounded-full object-cover"
                            />
                        </div>
                        <div className="w-2/3 flex flex-col justify-between gap-4">
                            <h1 className="text-xl font-semibold">{lesson.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Class: {lesson.class.name}</span>
                                <span>Subject: {lesson.subject.name}</span>
                                <span>Teacher: {lesson.teacher.name + " " + lesson.teacher.surname}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Day: {lesson.day}</span>
                                <span>
                                    {new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                    {new Date(lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ATTENDANCE SECTION */}
                {/* Only show if Admin or the Assigned Teacher */}
                {(role === "admin" || (role === "teacher" && lesson.teacherId === currentUserId)) && (
                    <AttendanceList
                        lessonId={lesson.id}
                        students={lesson.class.students}
                        initialAttendance={attendance}
                        role={role}
                    />
                )}
            </div>

            {/* RIGHT */}
            <div className="w-full xl:w-1/3 flex flex-col gap-4">
                <Announcements />
            </div>
        </div>
    );
};

export default SingleLessonPage;
