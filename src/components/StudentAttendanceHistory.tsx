import prisma from "@/lib/prisma";

const StudentAttendanceHistory = async ({ studentId }: { studentId: string }) => {
    const attendance = await prisma.attendance.findMany({
        where: {
            studentId: studentId,
        },
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
            <h2 className="text-xl font-semibold mb-4">My Attendance History</h2>
            {attendance.length === 0 ? (
                <p className="text-gray-500">No attendance records found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 font-medium border-b">
                            <tr>
                                <th className="py-2">Date</th>
                                <th className="py-2">Course</th>
                                <th className="py-2 mb-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((record) => (
                                <tr key={record.id} className="border-b last:border-none">
                                    <td className="py-3">
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3">{record.lesson.subject.name}</td>
                                    <td className="py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${record.present
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {record.present ? "Present" : "Absent"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentAttendanceHistory;
