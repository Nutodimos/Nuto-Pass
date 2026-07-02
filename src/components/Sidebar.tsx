"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, Home, Users, GraduationCap, BookOpen,
    ClipboardList, Fingerprint, Megaphone,
    Settings, LogOut, Layers, ChevronLeft, Presentation,
    Building2, FileText, Bell, BarChart3, Calendar,
    type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useTaxonomy, type TaxonomyMap } from "@/hooks/use-taxonomy";
import { useOrgMetadata } from "@/components/OrgMetadataProvider";
import type { NavItem as OrgNavItem } from "@/types/organization";

/** Maps icon name strings (from Clerk metadata) to Lucide components */
const iconMap: Record<string, LucideIcon> = {
    Home, Users, GraduationCap, BookOpen, ClipboardList,
    Fingerprint, Megaphone, Settings, Layers, Presentation,
    Building2, FileText, Bell, BarChart3, Calendar, LogOut,
};

/** Resolve a navItem label — if it starts with "Taxonomy." use the taxonomy hook */
function resolveLabel(label: string, taxonomy: TaxonomyMap): string {
    if (label.startsWith('Taxonomy.')) {
        const key = label.split('.')[1] as keyof TaxonomyMap;
        return (taxonomy[key] as string) ?? label;
    }
    return label;
}

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
            { icon: Home, label: "Home", href: "/", visible: ["admin", "teacher", "student"] },
            { icon: Fingerprint, label: "Attendance", href: "/list/attendance", visible: ["admin", "teacher", "student"] },
            { icon: Users, label: "Taxonomy.teacher", href: "/list/lecturers", visible: ["admin"] },
            { icon: GraduationCap, label: "Taxonomy.student", href: "/list/students", visible: ["admin", "teacher"] },
            { icon: BookOpen, label: "Taxonomy.subject", href: "/list/courses", visible: ["admin", "teacher", "student"] },
            { icon: Layers, label: "Taxonomy.class", href: "/list/levels", visible: ["admin", "teacher"] },
            { icon: Presentation, label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher", "student"] },
            { icon: BookOpen, label: "Materials", href: "/list/materials", visible: ["admin", "teacher", "student"] },
            { icon: ClipboardList, label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student"] },
            { icon: Megaphone, label: "Announcements", href: "/list/announcements", visible: ["admin", "teacher", "student"] },
            { icon: Fingerprint, label: "Biometrics", href: "/list/biometrics", visible: ["admin", "teacher"] },
        ],
    },
    {
        title: "OTHER",
        items: [
            { icon: Settings, label: "Settings", href: "/settings", visible: ["admin", "teacher", "student"] },
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
    const { signOut } = useClerk();
    const { metadata, orgName } = useOrgMetadata();
    const taxonomy = useTaxonomy();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Read dynamic nav items from Prisma-stored org metadata (via context)
    const orgNavItems = metadata?.uiConfig?.navItems;

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/" || pathname === `/${role}`;
        return pathname.startsWith(href);
    };

    const isFeatureEnabled = (href: string) => {
        const features = metadata?.features;
        if (!features) return true; // Default to true if no flags set

        if (href.includes("/biometrics") && features.hasBiometrics === false) return false;
        if (href.includes("/assignments") && features.hasAssignments === false) return false;
        if (href.includes("/materials") && features.hasMaterials === false) return false;
        
        return true;
    };

    // Org branding from metadata
    const orgLogo = metadata?.uiConfig?.logoUrl;
    const orgTitle = metadata?.uiConfig?.sidebarTitle;
    const orgPrimaryColor = metadata?.uiConfig?.primaryColor || "#0A1E4B";

    // Helper to convert hex to rgb string for rgba()
    const getRgb = (hex: string) => {
        const cleaned = hex.replace("#", "");
        const r = parseInt(cleaned.substring(0, 2), 16);
        const g = parseInt(cleaned.substring(2, 4), 16);
        const b = parseInt(cleaned.substring(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return "10, 30, 75";
        return `${r}, ${g}, ${b}`;
    };
    const orgPrimaryRgb = getRgb(orgPrimaryColor);

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`p-4 border-b border-slate-100 ${isCollapsed ? "flex justify-center" : ""}`}>
                <Link href="/" onClick={onNavigate} className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                    <div className={`relative ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}>
                        <Image src={orgLogo || "/cpeautomation-logo.png"} alt="logo" fill className="object-contain mix-blend-multiply" />
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold tracking-tight" style={{ color: orgPrimaryColor }}>
                            {orgTitle || orgName || "CPE Automation"}
                        </span>
                    )}
                </Link>
            </div>

            {/* User Info */}
            {showUserInfo && user && !isCollapsed && (
                <div className="p-4 border-b border-slate-100" style={{ background: `linear-gradient(to right, rgba(${orgPrimaryRgb}, 0.05), transparent)` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: `rgba(${orgPrimaryRgb}, 0.2)`, color: orgPrimaryColor }}>
                            {user.firstName?.[0] || user.username?.[0] || "U"}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-700 text-sm">
                                {user.firstName || user.username || "User"}
                            </p>
                            <p className="text-xs capitalize flex items-center gap-1" style={{ color: orgPrimaryColor }}>
                                {role === "teacher" ? "lecturer" : role}
                                {(user.publicMetadata?.orgSlug as string) && (
                                    <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 lowercase">{(user.publicMetadata.orgSlug as string)}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu Items — dynamic from org metadata, or hardcoded fallback */}
            <div className="flex-1 overflow-y-auto p-3">
                {orgNavItems && orgNavItems.length > 0 ? (
                    /* ── Dynamic nav from Clerk org publicMetadata ── */
                    <div className="mb-4">
                        {!isCollapsed && (
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                MENU
                            </p>
                        )}
                        <div className="space-y-1">
                            {orgNavItems.filter((item) => isFeatureEnabled(item.href)).map((item) => {
                                const Icon = iconMap[item.icon] || BookOpen;
                                const label = resolveLabel(item.label, taxonomy);
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        title={isCollapsed ? label : undefined}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center" : ""
                                            } ${active
                                                ? "text-white shadow-lg"
                                                : "text-slate-600 hover:text-[var(--org-primary)]"
                                            }`}
                                    style={active ? { backgroundColor: orgPrimaryColor, boxShadow: `0 10px 15px -3px rgba(${orgPrimaryRgb}, 0.3)` } : { }}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* ── Hardcoded fallback (existing behaviour) ── */
                    menuItems.map((section) => (
                        <div key={section.title} className="mb-4">
                            {!isCollapsed && (
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                    {section.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {section.items
                                    .filter((item) => item.visible.includes(role))
                                    .filter((item) => isFeatureEnabled(item.href))
                                    .map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        const label = resolveLabel(item.label, taxonomy);

                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={onNavigate}
                                                title={isCollapsed ? label : undefined}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isCollapsed ? "justify-center" : ""
                                                    } ${active
                                                        ? "text-white shadow-lg"
                                                        : "text-slate-600 hover:text-[var(--org-primary)]"
                                                    }`}
                                            style={active ? { backgroundColor: orgPrimaryColor, boxShadow: `0 10px 15px -3px rgba(${orgPrimaryRgb}, 0.3)` } : { }}
                                            >
                                                <Icon className="w-5 h-5 flex-shrink-0" />
                                                {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Logout */}
            <div className="p-3 border-t border-slate-100 mt-auto">
                <button
                    onClick={async () => {
                        try {
                            setIsLoggingOut(true);
                            await signOut();
                        } catch (error) {
                            console.error("Error signing out:", error);
                            setIsLoggingOut(false);
                        }
                    }}
                    disabled={isLoggingOut}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${isLoggingOut
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-50"
                        } transition-colors ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? "Logout" : undefined}
                >
                    {isLoggingOut ? (
                        <div className="w-5 h-5 flex-shrink-0 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                    ) : (
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                    )}
                    {!isCollapsed && (
                        <span className="font-medium text-sm">
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </span>
                    )}
                </button>
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
                        className="fixed top-0 left-0 bottom-0 w-[280px] shadow-2xl"
                        style={{ backgroundColor: 'var(--bg-sidebar)', zIndex: 9999 }}
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
                className="md:hidden p-2.5 rounded-xl bg-slate-50 hover:bg-CPENavy/10 border border-transparent hover:border-CPENavy/20 transition-all duration-200"
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
        return <div className="hidden md:flex flex-col h-full border-r border-slate-100 w-[240px]" style={{ backgroundColor: 'var(--bg-sidebar)' }} />;
    }

    return (
        <div
            className={`hidden md:flex flex-col h-full border-r border-slate-100 transition-all duration-300 relative ${isCollapsed ? "w-[70px]" : "w-[240px]"
                }`}
            style={{ backgroundColor: 'var(--bg-sidebar)' }}
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
