import { BookOpen, Calendar, Fingerprint } from "lucide-react";

type CardType = "courses" | "assignments" | "attendance";

interface StudentInfoCardProps {
    type: CardType;
    value: number | string;
    semesterText: string;
    sessionYear: string;
}

const StudentInfoCard = ({ type, value, semesterText, sessionYear }: StudentInfoCardProps) => {
    const cardStyles = {
        courses: {
            bg: "bg-gradient-to-br from-blue-500 to-blue-700",
            icon: BookOpen,
            iconBg: "bg-blue-400/20",
            label: "Enrolled Courses",
        },
        assignments: {
            bg: "bg-gradient-to-br from-orange-500 to-orange-700",
            icon: Calendar,
            iconBg: "bg-orange-400/20",
            label: "Pending Assignments",
        },
        attendance: {
            bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
            icon: Fingerprint,
            iconBg: "bg-emerald-400/20",
            label: "Attendance Rate",
        },
    };

    const style = cardStyles[type];
    const Icon = style.icon;

    return (
        <div className="group relative rounded-2xl p-6 flex-1 min-w-[200px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {/* Gradient Background */}
            <div className={`absolute inset-0 ${style.bg} opacity-100 group-hover:opacity-90 transition-opacity`}></div>

            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-xl ${style.iconBg} backdrop-blur-sm`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Count */}
                <div className="mb-4">
                    <h1 className="text-5xl font-extrabold text-white mb-1 tracking-tight">
                        {value}
                    </h1>
                    <h2 className="text-white/90 text-sm font-medium uppercase tracking-wider">
                        {style.label}
                    </h2>
                </div>

                {/* Session & Semester Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                        {sessionYear}
                    </span>
                    <span className="text-[10px] bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                        {semesterText} Semester
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StudentInfoCard;
