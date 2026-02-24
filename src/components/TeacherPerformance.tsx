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
        if (percent >= 80) return { stroke: "#436275", bg: "bg-nutoSlate" }; // nutoSlate
        if (percent >= 50) return { stroke: "#FF7F50", bg: "bg-nutoOrange" }; // nutoOrange
        return { stroke: "#E5673D", bg: "bg-nutoOrangeDark" }; // nutoOrangeDark
    };

    const colors = getPerformanceColor(performancePercent);

    return (
        <div className="bg-gradient-to-br from-nutoSlate/5 to-nutoOrange/5 p-6 rounded-2xl border border-nutoSlate/10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-nutoSlateDark">Performance</h2>
                {supervisedClass && (
                    <span className="px-3 py-1 rounded-full bg-nutoOrange text-white text-xs font-medium">
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
                        <span className="text-3xl font-bold text-nutoSlateDark">{performancePercent}%</span>
                        <span className="text-xs text-nutoSlate">Session Rate</span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-nutoSlate">Sessions Conducted</span>
                    <span className="font-bold text-nutoSlateDark">{sessionsCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-nutoSlate">Total Lessons</span>
                    <span className="font-bold text-nutoSlateDark">{lessonsCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                    <span className="text-sm text-nutoSlate">Materials Uploaded</span>
                    <span className="font-bold text-nutoOrange">{materialsCount}</span>
                </div>
            </div>
        </div>
    );
};

export default TeacherPerformance;
