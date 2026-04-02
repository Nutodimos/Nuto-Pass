export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import FormContainer from "@/components/FormContainer";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";
import MaterialCard from "@/components/MaterialCard";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Material, Prisma, Subject, Class, Teacher } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { FileText, BookOpen, GraduationCap, Library } from "lucide-react";

type MaterialList = Material & { subject: Subject } & { class: Class | null } & { teacher: Teacher | null };

const MaterialListPage = async ({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) => {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const currentUserId = userId;

    const { page, ...queryParams } = searchParams;
    const p = page ? parseInt(page) : 1;

    // URL PARAMS CONDITION for class-specific materials
    const query: Prisma.MaterialWhereInput = {
        isGeneral: false, // Only class-specific materials in main query
    };

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "search":
                        query.OR = [
                            { title: { contains: value, mode: "insensitive" } },
                            { subject: { name: { contains: value, mode: "insensitive" } } },
                            { teacher: { name: { contains: value, mode: "insensitive" } } },
                            { teacher: { surname: { contains: value, mode: "insensitive" } } },
                        ];
                        break;
                    case "classId":
                        query.classId = parseInt(value);
                        break;
                    case "subjectId":
                        query.subjectId = parseInt(value);
                        break;
                    case "teacherId":
                        query.teacherId = value;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    // RBAC LOGIC for class-specific or course-specific materials
    if (role === "student" && currentUserId) {
        const student = await prisma.student.findUnique({
            where: { id: currentUserId },
            select: { classId: true },
        });

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { studentId: currentUserId },
            select: { subjectId: true }
        });
        const enrolledSubjectIds = enrollments.map((e: { subjectId: number }) => e.subjectId);

        if (student) {
            query.AND = [
                ...(query.AND ? (Array.isArray(query.AND) ? query.AND : [query.AND]) : []),
                {
                    OR: [
                        { classId: student.classId },
                        { subjectId: { in: enrolledSubjectIds } }
                    ]
                }
            ];
        } else {
            query.classId = -1;
        }
    } else if (role === "teacher" && currentUserId) {
        query.teacherId = currentUserId;
    }

    // Fetch general materials (available to everyone)
    const generalMaterials = await prisma.material.findMany({
        where: {
            isGeneral: true,
            ...(queryParams.search ? {
                OR: [
                    { title: { contains: queryParams.search, mode: "insensitive" } },
                    { teacher: { name: { contains: queryParams.search, mode: "insensitive" } } },
                    { teacher: { surname: { contains: queryParams.search, mode: "insensitive" } } }
                ]
            } : {}),
        },
        include: {
            subject: true,
            class: true,
            teacher: true,
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch class-specific materials with pagination
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

    // Group class materials by subject for better organization
    const groupedBySubject = data.reduce((acc, item) => {
        const subjectName = item.subject.name;
        if (!acc[subjectName]) {
            acc[subjectName] = [];
        }
        acc[subjectName].push(item);
        return acc;
    }, {} as Record<string, MaterialList[]>);

    const totalCount = count + generalMaterials.length;

    return (
        <div className="flex-1 m-4 mt-0">
            {/* HEADER */}
            <div className="bg-gradient-to-r from-CPENavy to-CPENavyDark rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Course Materials</h1>
                            <p className="text-white/80 text-sm">{totalCount} resources available</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                            <TableSearch />
                        </div>
                    </div>
                </div>
            </div>

            {/* GENERAL RESOURCES SECTION */}
            {generalMaterials.length > 0 && (
                <div className="mb-8">
                    {/* General Section Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Library className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">📚 General Resources</h2>
                        <span className="px-2 py-0.5 bg-amber-100 rounded-full text-xs font-medium text-amber-700">
                            Available to all
                        </span>
                        <div className="h-px bg-amber-200 flex-1"></div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Important documents and resources for all students and teachers
                    </p>

                    {/* General Materials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {generalMaterials.map((item) => (
                            <MaterialCard
                                key={item.id}
                                id={item.id}
                                title={item.title}
                                filePath={item.filePath}
                                className="General"
                                teacherName={item.teacher ? `${item.teacher.name} ${item.teacher.surname}` : 'Admin'}
                                createdAt={item.createdAt}
                                canDelete={role === "admin"}
                                isGeneral={true}
                                deleteForm={
                                    role === "admin"
                                        ? <FormContainer table="material" type="delete" id={item.id} />
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* CLASS-SPECIFIC MATERIALS */}
            {data.length === 0 && generalMaterials.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No materials found</h3>
                    <p className="text-gray-500 text-sm">
                        {role === "teacher" ? "Upload your first course material to get started!" : "Check back later for course materials."}
                    </p>
                </div>
            ) : data.length > 0 && (
                <div className="space-y-8">
                    {Object.entries(groupedBySubject).map(([subjectName, materials]) => (
                        <div key={subjectName}>
                            {/* Subject Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-CPEGold/10 rounded-lg">
                                    <GraduationCap className="w-5 h-5 text-CPEGold" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-800">{subjectName}</h2>
                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                    {materials.length} {materials.length === 1 ? 'file' : 'files'}
                                </span>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            {/* Materials Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {materials.map((item) => (
                                    <MaterialCard
                                        key={item.id}
                                        id={item.id}
                                        title={item.title}
                                        filePath={item.filePath}
                                        className={item.class?.name || 'Course Wide'}
                                        teacherName={`${item.teacher?.name || ''} ${item.teacher?.surname || ''}`}
                                        createdAt={item.createdAt}
                                        canDelete={role === "admin" || (role === "teacher" && item.teacherId === currentUserId)}
                                        deleteForm={
                                            (role === "admin" || (role === "teacher" && item.teacherId === currentUserId))
                                                ? <FormContainer table="material" type="delete" id={item.id} />
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PAGINATION */}
            {count > ITEM_PER_PAGE && (
                <div className="mt-6 bg-white rounded-xl p-4">
                    <Pagination page={p} count={count} />
                </div>
            )}

            {/* FLOATING ACTION BUTTON */}
            {(role === "admin" || role === "teacher") && (
                <div className="fixed bottom-8 right-8 z-50 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-CPEGold rounded-full animate-ping opacity-75"></div>
                        <div className="relative">
                            <FormContainer table="material" type="create" />
                        </div>
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                                Upload Material
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                                    <div className="border-8 border-transparent border-l-slate-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialListPage;
