import { GraduationCap } from "lucide-react";

const StudentPerformance = async ({ studentId }: { studentId: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
    // Get total attendance records for this student
    const totalAttendances = await prisma.attendance.count({
        where: { studentId },
    });

    // Get present attendance records
    const presentAttendances = await prisma.attendance.count({
        where: {
            studentId,
            present: true,
        },
    });

    // Calculate attendance percentage
    const attendancePercent = totalAttendances > 0
        ? Math.round((presentAttendances / totalAttendances) * 100)
        : 0;

    // Get student's class info
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            class: {
                select: {
                    name: true,
                    _count: { select: { lessons: true } },
                },
            },
        },
    });

    // Determine color based on attendance
    const getPerformanceColor = (percent: number) => {
        if (percent >= 80) return { stroke: "#436275", bg: "bg-CPENavy" }; // CPENavy
        if (percent >= 50) return { stroke: "#FF7F50", bg: "bg-CPEGold" }; // CPEGold
        return { stroke: "#E5673D", bg: "bg-CPEGoldDark" }; // CPEGoldDark
    };

    const colors = getPerformanceColor(attendancePercent);

    return (
        <div className="bg-gradient-to-br from-CPENavy/5 to-CPEGold/5 p-6 rounded-2xl border border-CPENavy/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-CPENavyDark">Performance</h2>
                {student?.class && (
                    <span className="px-3 py-1 rounded-full bg-CPENavy text-white text-xs font-medium flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {student.class.name}
                    </span>
                )}
            </div>

            {/* Performance Circle */}
            <div className="flex justify-center mb-6">
                <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            strokeWidth="10"
                            stroke="#e2e8f0"
                            fill="none"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="40"
                            strokeWidth="10"
                            stroke={colors.stroke}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${attendancePercent * 2.51} 251`}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-CPENavyDark">{attendancePercent}%</span>
                        <span className="text-xs text-CPENavy">Attendance</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Classes Attended</span>
                    <span className="font-bold text-CPENavyDark">{presentAttendances}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Total Classes</span>
                    <span className="font-bold text-CPENavyDark">{totalAttendances}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Available Lessons</span>
                    <span className="font-bold text-CPEGold">{student?.class?._count.lessons || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default StudentPerformance;
