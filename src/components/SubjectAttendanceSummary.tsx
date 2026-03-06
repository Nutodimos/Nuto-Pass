import { auth } from "@clerk/nextjs/server";

const SubjectAttendanceSummary = async ({ studentId }: { studentId: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
    const { sessionClaims, userId } = auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const whereClause: any = {
        studentId: studentId,
        date: {
            gte: new Date(new Date().getFullYear(), 0, 1),
        },
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
    });

    const subjectStats: { [key: string]: { total: number; present: number } } = {};

    attendance.forEach((record) => {
        const subjectName = record.lesson.subject.name;
        if (!subjectStats[subjectName]) {
            subjectStats[subjectName] = { total: 0, present: 0 };
        }
        subjectStats[subjectName].total += 1;
        if (record.present) {
            subjectStats[subjectName].present += 1;
        }
    });

    return (
        <div className="bg-white p-4 rounded-md h-full">
            <h2 className="text-xl font-semibold mb-4">Course Attendance</h2>
            <div className="flex flex-col gap-4">
                {Object.entries(subjectStats).map(([subject, stats]) => {
                    const percentage = Math.round((stats.present / stats.total) * 100);
                    const color =
                        percentage >= 75
                            ? "bg-green-500"
                            : percentage >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500";

                    return (
                        <div key={subject} className="">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                    {subject}
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                    {percentage}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full ${color}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
                {Object.keys(subjectStats).length === 0 && (
                    <p className="text-gray-500 text-sm">No attendance records found.</p>
                )}
            </div>
        </div>
    );
};

export default SubjectAttendanceSummary;
