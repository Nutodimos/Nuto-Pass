import prisma from "@/lib/prisma";
import { TrendingUp, TrendingDown, Users, UserCheck, UserX } from "lucide-react";

const AttendanceOverviewCard = async () => {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's attendance
    const todayAttendance = await prisma.attendance.findMany({
        where: {
            date: {
                gte: today,
                lt: tomorrow,
            },
        },
    });

    const totalToday = todayAttendance.length;
    const presentToday = todayAttendance.filter((a) => a.present).length;
    const absentToday = totalToday - presentToday;
    const percentageToday = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

    // Get yesterday's attendance for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(today);

    const yesterdayAttendance = await prisma.attendance.findMany({
        where: {
            date: {
                gte: yesterday,
                lt: yesterdayEnd,
            },
        },
    });

    const totalYesterday = yesterdayAttendance.length;
    const presentYesterday = yesterdayAttendance.filter((a) => a.present).length;
    const percentageYesterday = totalYesterday > 0 ? Math.round((presentYesterday / totalYesterday) * 100) : 0;

    const percentageChange = percentageToday - percentageYesterday;
    const isPositive = percentageChange >= 0;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Today's Attendance</h3>
                    <p className="text-sm text-slate-500">
                        {today.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric"
                        })}
                    </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Main Percentage */}
            <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-5xl font-extrabold text-slate-800">
                        {percentageToday}%
                    </h2>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                        {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{Math.abs(percentageChange)}%</span>
                    </div>
                </div>
                <p className="text-sm text-slate-500">vs yesterday ({percentageYesterday}%)</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentageToday}%` }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <Users className="w-4 h-4 text-slate-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalToday}</p>
                    <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <UserCheck className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{presentToday}</p>
                    <p className="text-xs text-slate-500">Present</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <UserX className="w-4 h-4 text-red-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{absentToday}</p>
                    <p className="text-xs text-slate-500">Absent</p>
                </div>
            </div>
        </div>
    );
};

export default AttendanceOverviewCard;
