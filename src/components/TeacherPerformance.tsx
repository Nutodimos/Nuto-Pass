import prisma from "@/lib/prisma";

const TeacherPerformance = async ({ teacherId }: { teacherId: string }) => {
    // Get lessons count for this teacher
    const lessonsCount = await prisma.lesson.count({
        where: { teacherId, isActive: true },
    });

    // Get attendance sessions count (sessions started by this teacher's lessons)
    const sessionsCount = await prisma.attendanceSession.count({
        where: {
            lesson: { teacherId },
        },
    });

    // Calculate performance percentage
    const performancePercent = lessonsCount > 0
        ? Math.min(Math.round((sessionsCount / lessonsCount) * 100), 100)
        : 0;

    // Get materials count
    const materialsCount = await prisma.material.count({
        where: { teacherId },
    });

    // Check if level adviser (supervisor)
    const supervisedClass = await prisma.class.findFirst({
        where: { supervisorId: teacherId },
        select: { name: true },
    });

    // Determine color based on performance
    const getPerformanceColor = (percent: number) => {
        if (percent >= 80) return { stroke: "#436275", bg: "bg-CPENavy" }; // CPENavy
        if (percent >= 50) return { stroke: "#FF7F50", bg: "bg-CPEGold" }; // CPEGold
        return { stroke: "#E5673D", bg: "bg-CPEGoldDark" }; // CPEGoldDark
    };

    const colors = getPerformanceColor(performancePercent);

    return (
        <div className="bg-gradient-to-br from-CPENavy/5 to-CPEGold/5 p-6 rounded-2xl border border-CPENavy/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-CPENavyDark">Performance</h2>
                {supervisedClass && (
                    <span className="px-3 py-1 rounded-full bg-CPEGold text-white text-xs font-medium">
                        Level Adviser: {supervisedClass.name}
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
                            strokeDasharray={`${performancePercent * 2.51} 251`}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-CPENavyDark">{performancePercent}%</span>
                        <span className="text-xs text-CPENavy">Session Rate</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Sessions Conducted</span>
                    <span className="font-bold text-CPENavyDark">{sessionsCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Total Lessons</span>
                    <span className="font-bold text-CPENavyDark">{lessonsCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-CPENavy">Materials Uploaded</span>
                    <span className="font-bold text-CPEGold">{materialsCount}</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherPerformance;
