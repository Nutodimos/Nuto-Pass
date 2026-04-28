"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Users, GraduationCap, BookOpen, Calendar, ClipboardList, Fingerprint, MessageSquare, Megaphone, Settings, LogOut, Layers, Presentation, Download } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { usePwaInstall } from "./PwaInstallProvider";
interface MenuItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
    visible: string[];
}

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const menuItems: MenuSection[] = [
    {
        title: "MENU",
        items: [
            { icon: Home, label: "Home", href: "/", visible: ["admin", "teacher", "student", "parent"] },
            { icon: Fingerprint, label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student", "parent"] },
            { icon: Users, label: "Lecturers", href: "/list/lecturers", visible: ["admin", "student"] },
            { icon: GraduationCap, label: "Students", href: "/list/students", visible: ["admin", "teacher"] },
            { icon: BookOpen, label: "Courses", href: "/list/courses", visible: ["admin"] },
            { icon: Layers, label: "Levels", href: "/list/levels", visible: ["admin", "teacher"] },
            { icon: Presentation, label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
            { icon: ClipboardList, label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
            { icon: Calendar, label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
            { icon: MessageSquare, label: "Messages", href: "/list/messages", visible: ["admin", "teacher", "student", "parent"] },
            { icon: Megaphone, label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student", "parent"] },
        ],
    },
    {
        title: "OTHER",
        items: [
            { icon: Settings, label: "Settings", href: "/settings", visible: ["admin"] },
        ],
    },
];

const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { user } = useUser();
    const role = (user?.publicMetadata?.role as string) || "guest";
    const { isInstallable, promptInstall } = usePwaInstall();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Hamburger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-CPENavy/10 border border-transparent hover:border-CPENavy/20 transition-all duration-200"
            >
                <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
            </motion.button>

            {/* Overlay and Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[var(--bg-card)] shadow-2xl z-[201] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[var(--border-secondary)]">
                                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                                    <Image src="/cpeautomation-logo.png" alt="logo" width={32} height={32} className="mix-blend-multiply" />
                                    <span className="font-bold text-CPENavy">CPE Automation</span>
                                </Link>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--text-tertiary)]" />
                                </motion.button>
                            </div>

                            {/* User Info */}
                            {user && (
                                <div className="p-4 border-b border-[var(--border-secondary)] bg-gradient-to-r from-CPENavy/5 to-transparent">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-CPENavy/20 flex items-center justify-center text-CPENavy font-bold">
                                            {user.firstName?.[0] || user.username?.[0] || "U"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)]">
                                                {user.firstName || user.username || "User"}
                                            </p>
                                            <p className="text-xs text-CPENavy capitalize">{role}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="p-4">
                                {menuItems.map((section) => (
                                    <div key={section.title} className="mb-6">
                                        <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                                            {section.title}
                                        </p>
                                        <div className="space-y-1">
                                            {section.items
                                                .filter((item) => item.visible.includes(role))
                                                .map((item, index) => {
                                                    const Icon = item.icon;
                                                    const active = isActive(item.href);

                                                    return (
                                                        <motion.div
                                                            key={item.label}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.03 }}
                                                        >
                                                            <Link
                                                                href={item.href}
                                                                onClick={() => setIsOpen(false)}
                                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${active
                                                                    ? "bg-CPENavy text-white shadow-lg shadow-CPENavy/30"
                                                                    : "text-[var(--text-secondary)] hover:bg-CPENavy/10 hover:text-CPENavy"
                                                                    }`}
                                                            >
                                                                <Icon className="w-5 h-5" />
                                                                <span className="font-medium">{item.label}</span>
                                                            </Link>
                                                        </motion.div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}

                                {/* Install App & Logout */}
                                <div className="pt-4 border-t border-[var(--border-secondary)] space-y-2">
                                    {isInstallable && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setIsOpen(false);
                                                promptInstall();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-CPEGold hover:bg-CPEGold/10 transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            <span className="font-medium">Install App</span>
                                        </motion.button>
                                    )}
                                    <SignOutButton>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span className="font-medium">Logout</span>
                                        </motion.button>
                                    </SignOutButton>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default MobileMenu;
