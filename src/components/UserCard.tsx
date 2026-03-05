import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Users, GraduationCap, ShieldCheck } from "lucide-react";

const UserCard = async ({
  type,
}: {
  type: "admin" | "teacher" | "student";
}) => {
  const modelMap: Record<typeof type, any> = {
    admin: prisma.admin,
    teacher: prisma.teacher,
    student: prisma.student,
  };

  const linkMap: Record<typeof type, string> = {
    admin: "/list/admins",
    teacher: "/list/lecturers",
    student: "/list/students",
  };

  const data = await modelMap[type].count();

  // Fetch session year and semester
  const [sessionConfig, semesterConfig] = await Promise.all([
    prisma.schoolConfig.findUnique({ where: { key: "sessionYear" } }),
    prisma.schoolConfig.findUnique({ where: { key: "currentSemester" } }),
  ]);

  const sessionYear = sessionConfig?.value || "2024/25";
  const currentSemester = semesterConfig?.value || "1";
  const semesterText = currentSemester === "1" ? "Harmattan" : "Rain";

  // Card styling based on type
  const cardStyles = {
    admin: {
      bg: "bg-gradient-to-br from-purple-500 to-purple-700",
      icon: ShieldCheck,
      iconBg: "bg-purple-400/20",
      label: "Administrators",
    },
    teacher: {
      bg: "bg-gradient-to-br from-CPENavy to-CPENavyDark",
      icon: Users,
      iconBg: "bg-CPESlate/20",
      label: "Lecturers",
    },
    student: {
      bg: "bg-gradient-to-br from-CPEGold to-CPEGoldDark",
      icon: GraduationCap,
      iconBg: "bg-CPEGoldLight/20",
      label: "Students",
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
          <Link
            href={linkMap[type]}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group/link"
          >
            <svg
              className="w-5 h-5 text-white/70 group-hover/link:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Count */}
        <div className="mb-4">
          <h1 className="text-5xl font-extrabold text-white mb-1 tracking-tight">
            {data}
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

export default UserCard;
