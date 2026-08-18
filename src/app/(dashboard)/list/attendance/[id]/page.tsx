import prisma from "@/lib/prisma";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendancePanel from "@/components/AttendancePanel";
import DownloadAttendanceReportButton, { AttendanceStudentRow } from "@/components/DownloadAttendanceReportButton";
import { Student, Class, Attendance } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type StudentList = Student & { class: Class } & { attendances: Attendance[] };

const ClassAttendancePage = async ({
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

    // Access control: Only admin and teacher can access this page
    if (!role || (role !== "admin" && role !== "teacher")) {
        // If student, redirect to their profile
        if (role === "student" && currentUserId) {
            const student = await prisma.student.findUnique({
                where: { id: currentUserId },
                select: { username: true }
            });
            if (student?.username) {
                redirect(`/list/students/${student.username}`);
            }
        }
        redirect("/");
    }

    // For teachers, verify they have access to this class
    if (role === "teacher") {
        const hasAccess = await prisma.class.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    { supervisorId: currentUserId },
                    { lessons: { some: { teacherId: currentUserId } } },
                ],
            },
        });
        if (!hasAccess) {
            redirect("/list/attendance");
        }
    }

    const columns = [
        {
            header: "Info",
            accessor: "info",
        },
        {
            header: "Student ID",
            accessor: "studentId",
            className: "hidden md:table-cell",
        },
        {
            header: "Biometric ID",
            accessor: "biometricId",
            className: "hidden md:table-cell",
        },
        {
            header: "Attendance (%)",
            accessor: "attendance",
            className: "hidden md:table-cell",
        },
        {
            header: "Actions",
            accessor: "action",
        },
    ];

    const renderRow = (item: StudentList) => {
        // Calculate attendance percentage dynamically
        const totalDays = item.attendances.length;
        const presentDays = item.attendances.filter(a => a.present).length;
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
                        <p className="text-xs text-gray-500">{item.class.name}</p>
                    </div>
                </td>
                <td className="hidden md:table-cell">{item.username}</td>
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

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // URL PARAMS CONDITION
    const query: any = {
        classId: parseInt(id),
        isActive: true,
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
                }
            }
        }
    }

    // Fetch students, count, lessons, class info, and session configs
    const [data, count, allClassStudents, lessons, classInfo, sessionConfig, semesterConfig] = await prisma.$transaction([
        prisma.student.findMany({
            where: query,
            include: {
                class: true,
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), 0, 1),
                        }
                    }
                }
            },
            orderBy: { name: "asc" },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.student.count({ where: query }),
        prisma.student.findMany({
            where: {
                classId: parseInt(id),
                isActive: true,
            },
            include: {
                class: true,
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), 0, 1),
                        }
                    }
                }
            },
            orderBy: { name: "asc" },
        }),
        prisma.lesson.findMany({
            where: {
                classId: parseInt(id),
                isActive: true,
            },
            include: {
                subject: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
            },
            orderBy: [
                { day: "asc" },
                { startTime: "asc" },
            ],
        }),
        prisma.class.findUnique({
            where: { id: parseInt(id) },
            select: { name: true },
        }),
        prisma.schoolConfig.findFirst({ where: { key: "sessionYear" } }),
        prisma.schoolConfig.findFirst({ where: { key: "currentSemester" } }),
    ]);

    const className = classInfo?.name || data[0]?.class?.name || "Class";
    const sessionYear = sessionConfig?.value || "2024/25";
    const currentSemester = semesterConfig?.value || "1";
    const semesterText = currentSemester === "1" ? "Harmattan Semester" : "Rain Semester";

    const reportData: AttendanceStudentRow[] = allClassStudents.map((s) => {
        const total = s.attendances.length;
        const present = s.attendances.filter((a) => a.present).length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
        return {
            id: s.id,
            username: s.username,
            name: s.name,
            surname: s.surname,
            className: s.class?.name || className,
            totalSessions: total,
            presentSessions: present,
            percentage,
            biometricId: s.biometricId,
        };
    });

    // Transform lessons for the component
    const formattedLessons = lessons.map(lesson => ({
        id: lesson.id,
        name: lesson.name,
        day: lesson.day,
        startTime: lesson.startTime.toISOString(),
        endTime: lesson.endTime.toISOString(),
        subject: lesson.subject,
        teacher: lesson.teacher,
    }));

    return (
        <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
            {/* Attendance Session Control Panel */}
            <AttendancePanel lessons={formattedLessons} className={className} totalStudents={count} />

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header with Class Info and Search */}
                <div className="bg-gradient-to-r from-CPENavy/5 to-CPEGold/5 p-4 sm:p-5 border-b border-slate-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">{className.charAt(0)}</span>
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-CPENavyDark">
                                    {className}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500">{count} students enrolled</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            <DownloadAttendanceReportButton
                                type="class"
                                title={`${className} Level Attendance Report`}
                                sessionYear={sessionYear}
                                semester={semesterText}
                                data={reportData}
                                fileName={`Attendance_${className}_${new Date().toISOString().slice(0, 10)}.csv`}
                                buttonText="Download Report (CSV)"
                            />
                            <div className="flex-1 sm:flex-none bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
                                <TableSearch />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-2 sm:p-4 overflow-x-auto">
                    <Table columns={columns} renderRow={renderRow} data={data} />
                    <Pagination page={p} count={count} />
                </div>
            </div>
        </div>
    );
};

export default ClassAttendancePage;
