import Link from "next/link";
import {
    BookOpen,
    Presentation,
    ClipboardList,
    Megaphone,
    Rocket
} from "lucide-react";

const StudentQuickActions = () => {
    const actions = [
        {
            label: "My Schedule",
            href: "/list/lessons",
            icon: Presentation,
            color: "text-blue-600",
            bg: "bg-blue-50",
            hoverBg: "group-hover:bg-blue-100",
            highlight: true,
        },
        {
            label: "Course Materials",
            href: "/list/materials",
            icon: BookOpen,
            color: "text-emerald-500",
            bg: "bg-emerald-50",
            hoverBg: "group-hover:bg-emerald-100",
        },
        {
            label: "Due Assignments",
            href: "/list/assignments",
            icon: ClipboardList,
            color: "text-orange-500",
            bg: "bg-orange-50",
            hoverBg: "group-hover:bg-orange-100",
        },
        {
            label: "Announcements",
            href: "/list/announcements",
            icon: Megaphone,
            color: "text-purple-500",
            bg: "bg-purple-50",
            hoverBg: "group-hover:bg-purple-100",
        },
    ];

    return (
        <div className="group cpe-card p-6 w-full">
            <div className="group cpe-card-indicator"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="p-3 bg-gradient-to-br from-CPEGold to-CPEGoldDark rounded-xl">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                    <p className="text-sm text-slate-500">Fast track to your classes</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {actions.map((action, index) => (
                    <Link
                        key={index}
                        href={action.href}
                        className={`group flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 bg-white ${(action as any).highlight
                            ? "border-blue-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 ring-2 ring-blue-100"
                            : "border-slate-100 hover:border-CPENavy/30 hover:shadow-md"
                            }`}
                    >
                        <div className={`p-3 rounded-full mb-3 ${action.bg} ${action.hoverBg} transition-colors duration-200 ${(action as any).highlight ? "animate-pulse" : ""}`}>
                            <action.icon className={`w-6 h-6 ${action.color}`} />
                        </div>
                        <span className={`text-sm font-medium text-center transition-colors ${(action as any).highlight ? "text-blue-700 group-hover:text-blue-800 font-semibold" : "text-slate-700 group-hover:text-CPENavy"}`}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default StudentQuickActions;
