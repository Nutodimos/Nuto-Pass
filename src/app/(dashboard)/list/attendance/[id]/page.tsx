import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Student, Class, Attendance } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";

type StudentList = Student & { class: Class } & { attendances: Attendance[] };

const ClassAttendancePage = async ({
    params: { id },
    searchParams,
}: {
    params: { id: string };
    searchParams: { [key: string]: string | undefined };
}) => {
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
                className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
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
                <td className="hidden md:table-cell font-bold text-lamaSky">{percentage}%</td>
                <td>
                    <div className="flex items-center gap-2">
                        <Link href={`/list/students/${item.id}`}>
                            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
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

    const [data, count] = await prisma.$transaction([
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
    ]);

    const className = data[0]?.class?.name || "Class";

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">{className} - Attendance Overview</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                </div>
            </div>
            <Table columns={columns} renderRow={renderRow} data={data} />
            <Pagination page={p} count={count} />
        </div>
    );
};

export default ClassAttendancePage;
