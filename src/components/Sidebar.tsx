"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, Home, Users, GraduationCap, BookOpen, Calendar,
    ClipboardList, Fingerprint, MessageSquare, Megaphone,
    Settings, LogOut, Layers, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";

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
            { icon: Calendar, label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
            { icon: BookOpen, label: "Materials", href: "/list/materials", visible: ["admin", "teacher", "student"] },
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

// Sidebar content - reused for both mobile drawer and desktop
const SidebarContent = ({
    role,
    isCollapsed = false,
    onNavigate,
    showUserInfo = true
}: {
    role: string;
    isCollapsed?: boolean;
    onNavigate?: () => void;
    showUserInfo?: boolean;
}) => {
    const pathname = usePathname();
    const { user } = useUser();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`p-4 border-b border-slate-100 ${isCollapsed ? "flex justify-center" : ""}`}>
                <Link href="/" onClick={onNavigate} className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
                    <Image src="/nutopass-logo.png" alt="logo" width={32} height={32} className="mix-blend-multiply" />
                    {!isCollapsed && <span className="font-bold text-nutoSlate">NutoPass</span>}
                </Link>
            </div>

            {/* User Info */}
            {showUserInfo && user && !isCollapsed && (
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-nutoSlate/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-nutoSlate/20 flex items-center justify-center text-nutoSlate font-bold">
                            {user.firstName?.[0] || user.username?.[0] || "U"}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700 text-sm">
                                {user.firstName || user.username || "User"}
                            </p>
                            <p className="text-xs text-nutoSlate capitalize">{role}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-3">
                {menuItems.map((section) => (
                    <div key={section.title} className="mb-4">
                        {!isCollapsed && (
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                {section.title}
                            </p>
                        )}
                        <div className="space-y-1">
                            {section.items
                                .filter((item) => item.visible.includes(role))
                                .map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={onNavigate}
                                            title={isCollapsed ? item.label : undefined}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center" : ""
                                                } ${active
                                                    ? "bg-nutoSlate text-white shadow-lg shadow-nutoSlate/30"
                                                    : "text-slate-600 hover:bg-nutoSlate/10 hover:text-nutoSlate"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                                        </Link>
                                    );
                                })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-slate-100">
                <SignOutButton>
                    <button
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors ${isCollapsed ? "justify-center" : ""
                            }`}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </SignOutButton>
            </div>
        </div>
    );
};

// Mobile drawer portal
const MobileDrawer = ({
    isOpen,
    onClose,
    role
}: {
    isOpen: boolean;
    onClose: () => void;
    role: string;
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-white shadow-2xl"
                        style={{ zIndex: 9999 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        <SidebarContent role={role} onNavigate={onClose} showUserInfo={true} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

// Hamburger button for mobile
export const MobileMenuButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUser();
    const role = (user?.publicMetadata?.role as string)
        || (user?.username === "admin1" ? "admin" : "guest");

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2.5 rounded-xl bg-slate-50 hover:bg-nutoSlate/10 border border-transparent hover:border-nutoSlate/20 transition-all duration-200"
            >
                <Menu className="w-5 h-5 text-slate-600" />
            </motion.button>

            <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} role={role} />
        </>
    );
};

// Desktop sidebar component
const Sidebar = () => {
    const { user } = useUser();
    const role = (user?.publicMetadata?.role as string)
        || (user?.username === "admin1" ? "admin" : "guest");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by protecting client-dependent content
    if (!mounted) {
        return <div className="hidden md:flex flex-col h-full bg-white border-r border-slate-100 w-[240px]" />;
    }

    return (
        <div
            className={`hidden md:flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 relative ${isCollapsed ? "w-[70px]" : "w-[240px]"
                }`}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
            >
                <ChevronLeft className={`w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
            </button>

            <SidebarContent role={role} isCollapsed={isCollapsed} showUserInfo={true} />
        </div>
    );
};

export default Sidebar;
