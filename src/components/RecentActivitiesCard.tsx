import prisma from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, Megaphone, Clock, ArrowRight } from "lucide-react";

const RecentActivitiesCard = async () => {
    // Fetch recent students (last 3)
    const recentStudents = await prisma.student.findMany({
        take: 3,
        orderBy: {
            id: "desc",
        },
        select: {
            id: true,
            name: true,
            surname: true,
        },
    });

    // Fetch recent teachers (last 2)
    const recentTeachers = await prisma.teacher.findMany({
        take: 2,
        orderBy: {
            id: "desc",
        },
        select: {
            id: true,
            name: true,
            surname: true,
        },
    });

    // Fetch recent announcements (last 2)
    const recentAnnouncements = await prisma.announcement.findMany({
        take: 2,
        orderBy: {
            date: "desc",
        },
        select: {
            id: true,
            title: true,
            date: true,
        },
    });

    // Combine and format activities
    const activities = [
        ...recentStudents.map((s) => ({
            type: "student",
            title: `${s.name} ${s.surname} joined`,
            subtitle: "New student registered",
            time: "Recently",
            icon: UserPlus,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
        })),
        ...recentTeachers.map((t) => ({
            type: "teacher",
            title: `${t.name} ${t.surname} joined`,
            subtitle: "New lecturer registered",
            time: "Recently",
            icon: UserPlus,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
        })),
        ...recentAnnouncements.map((a) => ({
            type: "announcement",
            title: a.title,
            subtitle: "New announcement posted",
            time: getRelativeTime(a.date),
            icon: Megaphone,
            color: "text-orange-600",
            bgColor: "bg-orange-100",
        })),
    ].slice(0, 5);

    return (
        <div className="group nuto-card p-6 h-full flex flex-col">
            <div className="group nuto-card-indicator"></div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Recent Activities</h3>
                    <p className="text-sm text-slate-500">Latest system events</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Activities List */}
            <div className="flex-1 space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">No recent activities</p>
                    </div>
                ) : (
                    activities.map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                        >
                            <div className={`p-2 ${activity.bgColor} rounded-lg flex-shrink-0`}>
                                <activity.icon className={`w-4 h-4 ${activity.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                    {activity.title}
                                </p>
                                <p className="text-xs text-slate-500">{activity.subtitle}</p>
                            </div>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                                {activity.time}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* View All Link */}
            <Link
                href="/list/announcements"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-nutoSlate hover:text-nutoSlateDark transition-colors group"
            >
                <span>View all activities</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
};

// Helper function to get relative time
function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(date).toLocaleDateString();
}

export default RecentActivitiesCard;
