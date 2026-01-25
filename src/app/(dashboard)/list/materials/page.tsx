import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Material, Prisma, Subject, Class, Teacher } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

type MaterialList = Material & { subject: Subject } & { class: Class } & { teacher: Teacher | null };

const MaterialListPage = async ({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) => {
    const { userId, sessionClaims } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    const columns = [
        {
            header: "Title",
            accessor: "title",
        },
        {
            header: "Course",
            accessor: "subject",
            className: "hidden md:table-cell",
        },
        {
            header: "Level",
            accessor: "class",
            className: "hidden md:table-cell",
        },
        {
            header: "Uploader",
            accessor: "teacher",
            className: "hidden md:table-cell",
        },
        {
            header: "Date",
            accessor: "createdAt",
            className: "hidden lg:table-cell",
        },
        {
            header: "Actions",
            accessor: "action",
        },
    ];

    const renderRow = (item: MaterialList) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-nutoSlate/10"
        >
            <td className="flex items-center gap-4 p-4">
                <div className="flex flex-col">
                    <h3 className="font-semibold">{item.title}</h3>
                </div>
            </td>
            <td className="hidden md:table-cell">{item.subject.name}</td>
            <td className="hidden md:table-cell">{item.class.name}</td>
            <td className="hidden md:table-cell">{item.teacher?.name + " " + item.teacher?.surname}</td>
            <td className="hidden lg:table-cell">{new Intl.DateTimeFormat("en-US").format(item.createdAt)}</td>
            <td>
                <div className="flex items-center gap-2">
                    <Link href={item.filePath} target="_blank" className="w-7 h-7 flex items-center justify-center rounded-full bg-nutoSlate/20" title="View/Download">
                        <Image src="/view.png" alt="" width={16} height={16} />
                    </Link>
                    {(role === "admin" || (role === "teacher" && item.teacherId === currentUserId)) && (
                        <>
                            {/* No update for materials yet, just delete */}
                            <FormContainer table="material" type="delete" id={item.id} />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    const { page, ...queryParams } = searchParams;

    const p = page ? parseInt(page) : 1;

    // URL PARAMS CONDITION

    const query: Prisma.MaterialWhereInput = {};

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.title = { contains: value, mode: "insensitive" };
                        break;
                    case "classId": // Filter by level
                        query.classId = parseInt(value);
                        break;
                    case "subjectId": // Filter by course
                        query.subjectId = parseInt(value);
                        break;
                    case "teacherId": // Filter by lecturer
                        query.teacherId = value;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    // RBAC LOGIC
    if (role === "student" && currentUserId) {
        // Student can only see materials for their class
        const student = await prisma.student.findUnique({
            where: { id: currentUserId },
            select: { classId: true },
        });

        if (student) {
            query.classId = student.classId;
        } else {
            // Fallback if student record not found
            query.classId = -1; // Impossible ID to show nothing
        }
    } else if (role === "teacher" && currentUserId) {
        // Teacher can only see their own materials? 
        // User said: "lecturer teaching one course cannot see another lecturer materials"
        // This implies they see materials THEY uploaded.
        // Or materials for subject they teach?
        // "cannot see another lecturer materials" -> strict ownership or subject-based.
        // Let's assume strict ownership for now as it's safer.
        // Wait, if they teach the SAME subject as someone else?
        // "another lecturer materials" -> ownership.
        query.teacherId = currentUserId;
    }
    // Admin sees all (query remains as is)

    const [data, count] = await prisma.$transaction([
        prisma.material.findMany({
            where: query,
            include: {
                subject: true,
                class: true,
                teacher: true,
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
            orderBy: { createdAt: "desc" },
        }),
        prisma.material.count({ where: query }),
    ]);

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">Course Materials</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-nutoOrange">
                            <Image src="/filter.png" alt="" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-nutoOrange">
                            <Image src="/sort.png" alt="" width={14} height={14} />
                        </button>
                        {(role === "admin" || role === "teacher") && (
                            <FormContainer table="material" type="create" />
                        )}
                    </div>
                </div>
            </div>
            {/* LIST */}
            <Table columns={columns} renderRow={renderRow} data={data} />
            {/* PAGINATION */}
            <Pagination page={p} count={count} />
        </div>
    );
};

export default MaterialListPage;
