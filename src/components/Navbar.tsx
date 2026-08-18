"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MobileMenuButton } from "./Sidebar";
import { useOrgMetadata } from "./OrgMetadataProvider";

import {
  Search,
  Bell,
  Sparkles,
  Command,
  X,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  Building2,
  Megaphone,
  Fingerprint,
  Loader2,
  Presentation,
  Settings,
} from "lucide-react";

interface SearchCategory {
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  description?: string;
  roles?: string[];
}

interface SearchResult {
  type: "student" | "lecturer" | "subject" | "lesson" | "class";
  id: string;
  title: string;
  subtitle: string;
  img: string | null;
  route: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  student: GraduationCap,
  lecturer: Users,
  subject: BookOpen,
  lesson: Presentation,
  class: Building2,
};

const typeColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-600",
  lecturer: "bg-purple-100 text-purple-600",
  subject: "bg-green-100 text-green-600",
  lesson: "bg-orange-100 text-orange-600",
  class: "bg-teal-100 text-teal-600",
};

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: Date;
  targetAudience: string;
}

// Helper function to calculate time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString();
};

const Navbar = () => {
  const router = useRouter();
  const { user } = useUser();
  const { metadata, orgName, sessionYear, semesterText } = useOrgMetadata();
  const orgLogo = metadata?.uiConfig?.logoUrl;
  const orgPrimaryColor = metadata?.uiConfig?.primaryColor || "#0A1E4B";

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user role
  const userRole = (user?.publicMetadata?.role as string) || "guest";
  const userId = user?.id || "";
  const userUsername = user?.username || ""; // Matric/Staff ID for routing

  // Build categories based on role - Attendance is prioritized first
  const searchCategories: SearchCategory[] = useMemo(() => {
    // Attendance route varies by role
    let attendanceRoute = "/list/attendance"; // Default for admin
    let attendanceDesc = "View all class attendance";

    if (userRole === "student") {
      attendanceRoute = `/list/students/${userUsername}`; // Student sees their own record
      attendanceDesc = "View your attendance record";
    } else if (userRole === "teacher") {
      attendanceRoute = "/list/attendance"; // Lecturer sees their classes
      attendanceDesc = "Manage class attendance";
    }

    return [
      // Attendance is FIRST priority
      {
        name: "Attendance",
        route: attendanceRoute,
        icon: Fingerprint,
        keywords: [
          "attendance",
          "present",
          "absent",
          "biometric",
          "scan",
          "fingerprint",
        ],
        description: attendanceDesc,
      },
      {
        name: "Biometrics",
        route: "/list/biometrics",
        icon: Fingerprint,
        keywords: ["biometric", "fingerprint", "sensor", "r307", "enrollment", "wipe"],
        description: "Manage hardware and student biometrics",
        roles: ["admin", "teacher"],



      },
      {
        name: "Students",
        route: "/list/students",
        icon: GraduationCap,
        keywords: ["student", "pupils", "learner"],
        roles: ["admin", "teacher"],
      },
      {
        name: "Lecturers",
        route: "/list/lecturers",
        icon: Users,
        keywords: ["lecturer", "teacher", "instructor", "professor"],
        roles: ["admin"],
      },
      {
        name: "Levels",
        route: "/list/levels",
        icon: Building2,
        keywords: ["class", "level", "grade"],
      },
      {
        name: "Courses",
        route: "/list/courses",
        icon: BookOpen,
        keywords: ["subject", "course", "module"],
      },
      {
        name: "Lessons",
        route: "/list/lessons",
        icon: Presentation,
        keywords: ["lesson", "schedule", "timetable"],
      },
      {
        name: "Assignments",
        route: "/list/assignments",
        icon: ClipboardList,
        keywords: ["assignment", "homework", "task"],
      },
      {
        name: "Announcements",
        route: "/list/announcements",
        icon: Megaphone,
        keywords: ["announcement", "notice", "news"],
      },
      {
        name: "Events",
        route: "/list/events",
        icon: Calendar,
        keywords: ["event", "activity", "meeting"],
      },
    ].filter((cat) => {
      // Filter by role if specified
      if (!cat.roles) return true;
      return cat.roles.includes(userRole);
    });
  }, [userRole, userUsername]);

  const [filteredCategories, setFilteredCategories] = useState<
    SearchCategory[]
  >([]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setShowMobileSearch(true);
        } else {
          searchInputRef.current?.focus();
        }
      }
      if (e.key === "Escape") {
        setShowMobileSearch(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus mobile search input when modal opens
  useEffect(() => {
    if (showMobileSearch) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [showMobileSearch]);

  // Filter categories based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(searchCategories);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = searchCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.keywords.some((kw) => kw.includes(query)),
    );
    setFilteredCategories(filtered);
  }, [searchQuery, searchCategories]);

  // Debounced API search for individual results
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch announcements on mount to show unread count immediately
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();

    // Listen for custom event triggered by external read-receipt buttons
    window.addEventListener("refresh-notifications", fetchAnnouncements);
    return () => window.removeEventListener("refresh-notifications", fetchAnnouncements);
  }, []);

  const markAsRead = async (announcementId: number) => {
    // Update local state immediately for optimistic UI
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Persist to backend
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      });
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  const handleSearch = (route: string) => {
    const searchParam = searchQuery.trim()
      ? `?search=${encodeURIComponent(searchQuery)}`
      : "";
    router.push(`${route}${searchParam}`);
    setSearchQuery("");
    setShowMobileSearch(false);
    setSearchFocused(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredCategories.length > 0) {
      handleSearch(filteredCategories[0].route);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleNavigate = (route: string) => {
    router.push(route);
    setSearchQuery("");
    setSearchResults([]);
    setShowMobileSearch(false);
    setSearchFocused(false);
  };

  // Search Results Dropdown Component
  const SearchResults = ({ isMobile = false }: { isMobile?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`${isMobile ? "" : "absolute top-full left-0 mt-2 w-[400px]"} bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto`}
      style={{ zIndex: 9999 }}
    >
      {/* Individual Search Results */}
      {searchQuery.length >= 2 && (
        <div className="p-2 border-b border-slate-100">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {isSearching ? "Searching..." : `Results for "${searchQuery}"`}
            </p>
            {isSearching && (
              <Loader2 className="w-4 h-4 text-CPENavy animate-spin" />
            )}
          </div>

          {!isSearching && searchResults.length === 0 && (
            <div className="px-3 py-4 text-center text-slate-400 text-sm">
              No individual matches found
            </div>
          )}

          {searchResults.map((result, i) => {
            const Icon = typeIcons[result.type] || Search;
            const colorClass =
              typeColors[result.type] || "bg-slate-100 text-slate-600";

            return (
              <motion.button
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleNavigate(result.route)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-CPENavy/10 transition-colors text-left group"
              >
                {result.img ? (
                  <Image
                    src={result.img}
                    alt={result.title}
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {result.subtitle}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}
                >
                  {result.type}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Category Navigation */}
      <div className="p-2">
        <p className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
          {searchQuery ? "Browse Categories" : "Quick Navigation"}
        </p>
        {filteredCategories.slice(0, 5).map((cat, i) => (
          <motion.button
            key={cat.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => handleSearch(cat.route)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-CPENavy/10 transition-colors text-left group"
          >
            <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-CPENavy/20 transition-colors">
              <cat.icon className="w-4 h-4 text-CPENavy" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{cat.name}</p>
              <p className="text-xs text-slate-400">
                {cat.description || `Browse all ${cat.name.toLowerCase()}`}
              </p>
            </div>
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              →
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 pt-[max(env(safe-area-inset-top),0.5rem)] flex items-center justify-between px-4 md:px-6 py-3 bg-[var(--bg-navbar)] backdrop-blur-md border-b border-[var(--border-secondary)] shadow-sm"
        style={{ zIndex: 100 }}
      >
        {/* Left Section - Mobile Menu and Search */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Icon */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileSearch(true)}
            className="md:hidden p-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-CPENavy/10 active:scale-95 border border-transparent hover:border-CPENavy/20 transition-all duration-200"
          >
            <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
          </motion.button>
        </div>

        {/* Center - Mobile Logo (only visible on small screens) */}
        <Link href="/" className="md:hidden flex items-center gap-2">
          {orgLogo ? (
            <Image
              src={orgLogo}
              alt="Logo"
              width={70}
              height={70}
              className="mix-blend-multiply object-contain"
            />
          ) : (
            <div className="flex items-center justify-center font-bold rounded-lg w-10 h-10 text-lg shadow-sm" style={{ backgroundColor: `${orgPrimaryColor}20`, color: orgPrimaryColor }}>
                {(orgName || "O").charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:block relative">
          <form onSubmit={handleSearchSubmit}>
            <motion.div
              animate={{
                width: searchFocused ? 360 : 280,
                boxShadow: searchFocused
                  ? "0 4px 20px rgba(67, 98, 117, 0.15)"
                  : "0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-CPENavy/30 transition-colors"
            >
              <Search
                className={`w-4 h-4 transition-colors ${searchFocused ? "text-CPENavy" : "text-slate-400"}`}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[10px] text-slate-400">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </motion.div>
          </form>

          {/* Desktop Search Results Dropdown */}
          <AnimatePresence>
            {searchFocused && <SearchResults />}
          </AnimatePresence>
        </div>

        {/* Center Section - Academic Term & Date/Time */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs xl:text-sm">
          {sessionYear && semesterText && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-CPEGold/10 border border-CPEGold/25 text-CPENavyDark font-semibold shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-CPEGold" />
              <span>{sessionYear}</span>
              <span className="text-slate-300">•</span>
              <span className="text-CPEGoldDark font-bold">{semesterText}</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-CPENavy/5 to-transparent border border-slate-100"
          >
            <Sparkles className="w-4 h-4 text-CPEGold" />
            <span className="text-slate-600 font-medium">
              {formatDate(currentTime)}
            </span>
            <span className="text-CPENavy font-semibold">
              {formatTime(currentTime)}
            </span>
          </motion.div>
        </div>

        {/* Right Section - Icons and User */}
        <div className="flex items-center gap-2">
          {/* Announcements Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-CPENavy/10 active:scale-95 border border-transparent hover:border-CPENavy/20 transition-all duration-200 group"
          >
            <Bell className="w-5 h-5 text-slate-500 group-hover:text-CPENavy transition-colors" />
            {unreadCount > 0 && (
              <>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 bg-gradient-to-br from-CPEGold to-CPEGoldDark text-white text-[10px] font-bold rounded-full shadow-lg shadow-CPEGold/30"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-CPEGold rounded-full animate-ping opacity-30" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />

          {/* User Profile Section */}
          <motion.div
            whileHover={{ backgroundColor: "rgba(67, 98, 117, 0.05)" }}
            className="hidden md:flex items-center gap-3 pl-2 sm:pl-3 pr-2 py-1.5 rounded-xl cursor-pointer transition-colors"
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700 leading-tight">
                {user?.firstName || user?.username || "User"}
              </span>
              <span className="text-xs text-CPENavy font-medium capitalize">
                {(userRole === "teacher" ? "Lecturer" : userRole) ||
                  (user?.username === "admin1" ? "Admin" : "Guest")}
              </span>
            </div>

            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="ring-2 ring-CPENavy/20 ring-offset-2 rounded-full"
              >
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Settings"
                      labelIcon={<Settings className="w-4 h-4" />}
                      href="/settings"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </motion.div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
          </motion.div>
        </div>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40"
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 right-4 md:right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
              >
                <div className="px-4 py-3 bg-gradient-to-r from-CPENavy to-CPENavyDark flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <p className="text-white/70 text-xs">
                      {unreadCount > 0
                        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                        : "No unread notifications"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500">
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    announcements.map((announcement, i) => {
                      const timeAgo = getTimeAgo(new Date(announcement.date));
                      const icon =
                        announcement.targetAudience === "students"
                          ? "👨‍🎓"
                          : announcement.targetAudience === "teachers"
                            ? "👨‍🏫"
                            : "�";

                      return (
                        <motion.div
                          key={announcement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => markAsRead(announcement.id)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <span className="text-2xl">{icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">
                              {announcement.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {announcement.description}
                            </p>
                            <p className="text-xs text-CPENavy mt-1">
                              {timeAgo}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <Link
                    href="/list/announcements"
                    className="block w-full text-center"
                  >
                    <span className="text-sm font-medium text-CPENavy hover:text-CPENavyDark transition-colors">
                      View all notifications
                    </span>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Search Modal */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[150] md:hidden flex flex-col pt-[max(env(safe-area-inset-top),1rem)]"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col h-full bg-slate-50 overflow-hidden"
            >
              {/* Search Input Area */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white shadow-sm shrink-0"
              >
                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 border-transparent focus-within:bg-white focus-within:border-CPENavy/30 focus-within:ring-2 focus-within:ring-CPENavy/10 transition-all">
                  <Search className="w-5 h-5 text-CPENavy" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder:text-slate-400 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileSearch(false)}
                  className="font-medium text-CPENavy px-2 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </form>

              {/* Mobile Search Results */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-2 pb-32">
                  <SearchResults isMobile />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
