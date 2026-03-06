export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendancePanel from "@/components/AttendancePanel";
import { Student, Class, Attendance } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type StudentList = Student & { class: Class } & { attendances: Attendance[] };

const CourseAttendancePage = async ({
    params: { id },
    searchParams,
}: {
    params: { id: string };
    searchParams: { [key: string]: string | undefined };
}) => {
    const { sessionClaims, userId } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    if (!currentUserId) {
        return redirect("/");
    }

    // Access control: Only admin and teacher can access
    if (!role || (role !== "admin" && role !== "teacher")) {
        redirect("/");
    }

    const subjectId = parseInt(id);

    // Fetch the subject
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
            teachers: { select: { id: true } },
        },
    });

    if (!subject) {
        redirect("/list/attendance");
    }

    // For teachers, verify they teach this course
    if (role === "teacher") {
        const teachesThis = subject.teachers.some((t) => t.id === currentUserId);
        if (!teachesThis) {
            redirect("/list/attendance");
        }
    }

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // Build search filter for students
    const searchFilter = queryParams.search
        ? {
            OR: [
                { name: { contains: queryParams.search, mode: "insensitive" as const } },
                { surname: { contains: queryParams.search, mode: "insensitive" as const } },
                { username: { contains: queryParams.search, mode: "insensitive" as const } },
            ],
        }
        : {};

    // Get enrolled student IDs first 
    const enrollments = await prisma.courseEnrollment.findMany({
        where: { subjectId },
        select: { studentId: true },
    });
    const enrolledStudentIds = enrollments.map((e: { studentId: string }) => e.studentId);

    // Fetch enrolled students with attendance data
    const studentQuery = {
        id: { in: enrolledStudentIds },
        isActive: true,
        ...searchFilter,
    };

    const [data, count] = await prisma.$transaction([
        prisma.student.findMany({
            where: studentQuery,
            include: {
                class: true,
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), 0, 1),
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.student.count({ where: studentQuery }),
    ]);

    // Fetch lessons for this subject (for attendance session control)
    const lessons = await prisma.lesson.findMany({
        where: {
            subjectId,
            isActive: true,
        },
        include: {
            subject: { select: { name: true } },
            teacher: { select: { name: true, surname: true } },
        },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    const formattedLessons = lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
        day: lesson.day,
        startTime: lesson.startTime.toISOString(),
        endTime: lesson.endTime.toISOString(),
        subject: lesson.subject,
        teacher: lesson.teacher,
    }));

    const columns = [
        { header: "Info", accessor: "info" },
        { header: "Matric No.", accessor: "studentId", className: "hidden md:table-cell" },
        { header: "Class", accessor: "class", className: "hidden lg:table-cell" },
        { header: "Biometric ID", accessor: "biometricId", className: "hidden md:table-cell" },
        { header: "Attendance (%)", accessor: "attendance", className: "hidden md:table-cell" },
        { header: "Actions", accessor: "action" },
    ];

    const renderRow = (item: StudentList) => {
        const totalDays = item.attendances.length;
        const presentDays = item.attendances.filter((a) => a.present).length;
        const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";

        return (
            <tr
                key={item.id}
                className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-CPENavy/10"
            >
                <td className="flex items-center gap-4 p-4">
                    <Image
                        src={item.img || "/noAvatar.png"}
                        alt=""
                        width={40}
                        height={40}
                        className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                        <h3 className="font-semibold">{item.name} {item.surname}</h3>
                        <p className="text-xs text-gray-500">{item.username}</p>
                    </div>
                </td>
                <td className="hidden md:table-cell">{item.username}</td>
                <td className="hidden lg:table-cell">{item.class?.name || "—"}</td>
                <td className="hidden md:table-cell">{item.biometricId || "Not Registered"}</td>
                <td className="hidden md:table-cell font-bold text-CPENavy">{percentage}%</td>
                <td>
                    <div className="flex items-center gap-2">
                        <Link href={`/list/students/${item.username}`}>
                            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-CPENavy/20">
                                <Image src="/view.png" alt="" width={16} height={16} />
                            </button>
                        </Link>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="flex-1 flex flex-col gap-6 p-4">
            {/* Attendance Session Control Panel */}
            {formattedLessons.length > 0 && (
                <AttendancePanel lessons={formattedLessons} className={subject.name} totalStudents={count} />
            )}

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-CPENavy/5 to-CPEGold/5 p-5 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{subject.name.charAt(0)}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-CPENavyDark">
                                    {subject.name}
                                </h2>
                                <p className="text-sm text-gray-500">{count} enrolled students</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex-1 md:flex-none bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
                                <TableSearch />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="p-4">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Image src="/noAvatar.png" alt="" width={48} height={48} className="opacity-30 mb-3" />
                            <p className="text-gray-400 text-sm">No enrolled students found</p>
                        </div>
                    ) : (
                        <>
                            <Table columns={columns} renderRow={renderRow} data={data} />
                            <Pagination page={p} count={count} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseAttendancePage;
