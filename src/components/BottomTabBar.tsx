"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Home,
  Fingerprint,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
  ClipboardList,
  Users,
  FileText,
  Settings,
  LogOut,
  Megaphone,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";

interface Tab {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const roleTabs: Record<string, Tab[]> = {
  admin: [
    { icon: Home, label: "Home", href: "/admin" },
    { icon: Fingerprint, label: "Attendance", href: "/list/attendance" },
    { icon: GraduationCap, label: "Students", href: "/list/students" },
    { icon: BookOpen, label: "Courses", href: "/list/courses" },
  ],
  teacher: [
    { icon: Home, label: "Home", href: "/teacher" },
    { icon: Fingerprint, label: "Attendance", href: "/list/attendance" },
    { icon: BookOpen, label: "Courses", href: "/list/courses" },
    { icon: ClipboardList, label: "Assignments", href: "/list/assignments" },
  ],
  student: [
    { icon: Home, label: "Home", href: "/student" },
    { icon: Fingerprint, label: "Attendance", href: "/list/attendance" },
    { icon: BookOpen, label: "Courses", href: "/list/courses" },
    { icon: FileText, label: "Materials", href: "/list/materials" },
  ],
};

const moreMenuItems = [
  { icon: Users, label: "Lecturers", href: "/list/lecturers", roles: ["admin"] },
  { icon: Building2, label: "Levels", href: "/list/levels", roles: ["admin"] },
  { icon: GraduationCap, label: "Students", href: "/list/students", roles: ["teacher"] },
  { icon: BookOpen, label: "Lessons", href: "/list/lessons", roles: ["admin", "teacher", "student"] },
  { icon: ClipboardList, label: "Assignments", href: "/list/assignments", roles: ["admin", "student"] },
  { icon: FileText, label: "Materials", href: "/list/materials", roles: ["admin", "teacher"] },
  { icon: Megaphone, label: "Announcements", href: "/list/announcements", roles: ["admin", "teacher", "student"] },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const role = (user?.publicMetadata?.role as string) || "student";
  const tabs = roleTabs[role] || roleTabs.student;
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === `/${role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const moreItems = moreMenuItems.filter((item) => item.roles.includes(role));

  // Check if any "More" item is active
  const moreIsActive = moreItems.some((item) => pathname.startsWith(item.href)) || moreOpen;

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 bg-[var(--bg-card)] rounded-t-2xl shadow-2xl border-t border-[var(--border-primary)] z-50 md:hidden"
            >
              <div className="p-4">
                <div className="w-10 h-1 bg-[var(--bg-subtle)] rounded-full mx-auto mb-4" />
                <div className="grid grid-cols-3 gap-3">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 ${active
                          ? "bg-CPENavy/10 text-CPENavy"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] font-semibold">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="w-full h-px bg-[var(--border-secondary)] my-4" />

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/settings"
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-secondary)]"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="text-[11px] font-semibold">Settings</span>
                  </Link>

                  <button
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 text-red-500 hover:bg-red-500/10 border border-red-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-[11px] font-semibold">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-navbar)] backdrop-blur-lg border-t border-[var(--border-secondary)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors active:scale-95 ${active ? "text-CPENavy" : "text-[var(--text-tertiary)]"
                  }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-CPEGold" />
                )}
                <Icon className={`w-5 h-5 transition-all ${active ? "stroke-[2.5]" : ""}`} />
                <span className={`text-[10px] font-semibold ${active ? "text-CPENavy" : "text-[var(--text-tertiary)]"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors active:scale-95 ${moreIsActive ? "text-CPENavy" : "text-[var(--text-tertiary)]"
              }`}
          >
            {moreIsActive && !moreOpen && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-CPEGold" />
            )}
            <MoreHorizontal className={`w-5 h-5 transition-all ${moreIsActive ? "stroke-[2.5]" : ""}`} />
            <span className={`text-[10px] font-semibold ${moreIsActive ? "text-CPENavy" : "text-[var(--text-tertiary)]"}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
