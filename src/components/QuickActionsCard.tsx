import Link from "next/link";
import {
    Megaphone,
    UserPlus,
    GraduationCap,
    CalendarDays,
    Settings,
    FileText
} from "lucide-react";

const QuickActionsCard = () => {
    const actions = [
        {
            label: "New Announcement",
            href: "/list/announcements",
            icon: Megaphone,
            color: "text-orange-500",
            bg: "bg-orange-50",
            hoverBg: "group-hover:bg-orange-100",
        },
        {
            label: "Admit Student",
            href: "/list/students",
            icon: GraduationCap,
            color: "text-blue-500",
            bg: "bg-blue-50",
            hoverBg: "group-hover:bg-blue-100",
        },
        {
            label: "Add Lecturer",
            href: "/list/lecturers",
            icon: UserPlus,
            color: "text-purple-500",
            bg: "bg-purple-50",
            hoverBg: "group-hover:bg-purple-100",
        },
        {
            label: "Manage Events",
            href: "/list/events",
            icon: CalendarDays,
            color: "text-pink-500",
            bg: "bg-pink-50",
            hoverBg: "group-hover:bg-pink-100",
        },
        {
            label: "View Reports",
            href: "/list/results",
            icon: FileText,
            color: "text-green-500",
            bg: "bg-green-50",
            hoverBg: "group-hover:bg-green-100",
        },
        {
            label: "Settings",
            href: "/settings",
            icon: Settings,
            color: "text-slate-500",
            bg: "bg-slate-50",
            hoverBg: "group-hover:bg-slate-100",
        },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-nutoSlate to-nutoSlateDark rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                    <p className="text-sm text-slate-500">Shortcuts for common tasks</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className="group flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-nutoSlate/30 hover:shadow-md transition-all duration-200 bg-white"
                    >
                        <div className={`p-3 rounded-full mb-3 ${action.bg} ${action.hoverBg} transition-colors duration-200`}>
                            <action.icon className={`w-6 h-6 ${action.color}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 text-center group-hover:text-nutoSlate transition-colors">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsCard;
