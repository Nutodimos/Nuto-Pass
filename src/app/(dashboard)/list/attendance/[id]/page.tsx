import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AttendancePanel from "@/components/AttendancePanel";
import prisma from "@/lib/prisma";
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
                className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-nutoSlate/10"
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
                <td className="hidden md:table-cell font-bold text-nutoSlate">{percentage}%</td>
                <td>
                    <div className="flex items-center gap-2">
                        <Link href={`/list/students/${item.username}`}>
                            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-nutoSlate/20">
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

    const query: any = {
        classId: parseInt(id),
    };

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.name = { contains: value, mode: "insensitive" };
                        break;
                }
            }
        }
    }

    // Fetch students, count, lessons, and class info in one transaction
    const [data, count, lessons, classInfo] = await prisma.$transaction([
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
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
        }),
        prisma.student.count({ where: query }),
        prisma.lesson.findMany({
            where: {
                classId: parseInt(id),
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
    ]);

    const className = classInfo?.name || data[0]?.class?.name || "Class";

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
        <div className="flex flex-col gap-6 p-4">
            {/* Attendance Session Control Panel */}
            <AttendancePanel lessons={formattedLessons} className={className} totalStudents={count} />

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header with Class Info and Search */}
                <div className="bg-gradient-to-r from-nutoSlate/5 to-nutoOrange/5 p-5 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nutoSlate to-nutoSlateDark flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{className.charAt(0)}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-nutoSlateDark">
                                    {className}
                                </h2>
                                <p className="text-sm text-gray-500">{count} students enrolled</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="flex-1 md:flex-none bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
                                <TableSearch />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Content */}
                <div className="p-4">
                    <Table columns={columns} renderRow={renderRow} data={data} />
                    <Pagination page={p} count={count} />
                </div>
            </div>
        </div>
    );
};

export default ClassAttendancePage;
