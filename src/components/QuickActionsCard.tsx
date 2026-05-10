import Link from "next/link";
import {
    Megaphone,
    UserPlus,
    GraduationCap,
    CalendarDays,
    Settings,
    FileText,
    Fingerprint,
    ScanLine
} from "lucide-react";

const QuickActionsCard = () => {
    const actions = [
        {
            label: "Take Attendance",
            href: "/list/attendance",
            icon: Fingerprint,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            hoverBg: "group-hover:bg-emerald-100",
            highlight: true,
        },
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
            label: "Biometric Reg.",
            href: "/list/students",
            icon: ScanLine,
            color: "text-indigo-500",
            bg: "bg-indigo-50",
            hoverBg: "group-hover:bg-indigo-100",
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
        <div className="group cpe-card p-6 w-full">
            <div className="group cpe-card-indicator"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="p-3 bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-xl">
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
                        className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 bg-white ${(action as any).highlight
                            ? "border-emerald-300 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-100 ring-2 ring-emerald-100"
                            : "border-slate-100 hover:border-CPENavy/30 hover:shadow-md"
                            }`}
                    >
                        <div className={`p-3 rounded-full mb-3 ${action.bg} ${action.hoverBg} transition-colors duration-200 ${(action as any).highlight ? "animate-pulse" : ""}`}>
                            <action.icon className={`w-6 h-6 ${action.color}`} />
                        </div>
                        <span className={`text-sm font-medium text-center transition-colors ${(action as any).highlight ? "text-emerald-700 group-hover:text-emerald-800 font-semibold" : "text-slate-700 group-hover:text-CPENavy"}`}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default QuickActionsCard;
