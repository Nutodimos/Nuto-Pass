"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Square,
    Radio,
    Users,
    Clock,
    CheckCircle2,
    Loader2,
    Fingerprint,
    Zap,
    UserCheck,
    UserX,
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";

interface AttendanceSessionControlProps {
    lessonId: number;
    lessonName: string;
    className: string;
    totalStudents?: number;
}

interface SessionData {
    id: number;
    lessonId: number;
    startTime: string;
    endTime: string | null;
    status: "OPEN" | "CLOSED";
}

interface AttendanceRecord {
    id: string;
    name: string;
    surname: string;
    img: string | null;
    timestamp: Date;
}

const AttendanceSessionControl = ({
    lessonId,
    lessonName,
    className,
    totalStudents = 0,
}: AttendanceSessionControlProps) => {
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState("00:00:00");
    const [recentAttendees, setRecentAttendees] = useState<AttendanceRecord[]>([]);

    const checkExistingSession = useCallback(async () => {
        try {
            const res = await fetch(`/api/attendance/session?lessonId=${lessonId}`);
            const data = await res.json();
            if (data && data.status === "OPEN") {
                setSession(data);
            }
        } catch (error) {
            console.error("Error checking session:", error);
        } finally {
            setCheckingSession(false);
        }
    }, [lessonId]);

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, [checkExistingSession]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (session?.status === "OPEN") {
            interval = setInterval(() => {
                const start = new Date(session.startTime).getTime();
                const now = Date.now();
                const diff = now - start;
                const hours = Math.floor(diff / 3600000).toString().padStart(2, "0");
                const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
                const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
                setElapsedTime(`${hours}:${minutes}:${seconds}`);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [session]);

    // Polling for attendance updates during open session
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        if (session?.status === "OPEN") {
            pollInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/attendance/session/${session.id}/attendees`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.count !== attendanceCount) {
                            setAttendanceCount(data.count);
                            if (data.recent && data.recent.length > recentAttendees.length) {
                                const newAttendees = data.recent.slice(0, 5);
                                setRecentAttendees(newAttendees);
                                // Show toast for new scan
                                if (newAttendees[0]) {
                                    toast.success(`✓ ${newAttendees[0].name} ${newAttendees[0].surname} checked in!`, {
                                        position: "top-right",
                                        autoClose: 2000,
                                    });
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error("Polling error:", error);
                }
            }, 3000); // Poll every 3 seconds
        }
        return () => clearInterval(pollInterval);
    }, [session, attendanceCount, recentAttendees.length]);



    const startSession = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/attendance/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId }),
            });
            const data = await res.json();
            if (res.ok) {
                setSession(data.session);
                setAttendanceCount(0);
                setRecentAttendees([]);
                toast.success("🎉 Attendance session started!", {
                    position: "top-center",
                    autoClose: 3000,
                });
            } else {
                toast.error(data.message || "Failed to start session");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const endSession = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch("/api/attendance/session", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: session.id }),
            });
            const data = await res.json();
            if (res.ok) {
                setSession(null);
                setElapsedTime("00:00:00");
                setRecentAttendees([]);
                toast.success(`✅ Session ended! ${attendanceCount} students marked present.`, {
                    position: "top-center",
                    autoClose: 3000,
                });
            } else {
                toast.error(data.message || "Failed to end session");
            }
        } catch (error) {
            toast.error("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl"
            >
                <div className="flex items-center justify-center gap-3 text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Checking session status...</span>
                </div>
            </motion.div>
        );
    }

    const absentCount = totalStudents - attendanceCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden"
        >
            {/* Main Control Card */}
            <div
                className={`relative rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-500 ${session?.status === "OPEN"
                    ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"
                    : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
                    }`}
            >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div
                                animate={session?.status === "OPEN" ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`p-2 sm:p-3 rounded-xl ${session?.status === "OPEN"
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-700 text-slate-400"
                                    }`}
                            >
                                <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6" />
                            </motion.div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white">{lessonName}</h2>
                                <p className="text-xs sm:text-sm text-white/70">{className}</p>
                            </div>
                        </div>

                        {/* Live Indicator */}
                        <AnimatePresence>
                            {session?.status === "OPEN" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full"
                                >
                                    <motion.div
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"
                                    />
                                    <span className="text-xs sm:text-sm font-semibold text-white">LIVE</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Stats Row */}
                    <div className={`grid gap-3 sm:gap-4 mb-4 sm:mb-6 ${session?.status === "OPEN" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-3 sm:p-4 rounded-xl backdrop-blur-sm ${session?.status === "OPEN"
                                ? "bg-white/20"
                                : "bg-slate-700/50"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 text-white/70 mb-1">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs uppercase tracking-wide">Duration</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-mono font-bold text-white">{elapsedTime}</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-3 sm:p-4 rounded-xl backdrop-blur-sm ${session?.status === "OPEN"
                                ? "bg-white/20"
                                : "bg-slate-700/50"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 text-white/70 mb-1">
                                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs uppercase tracking-wide">Present</span>
                            </div>
                            <p className="text-xl sm:text-2xl font-bold text-white">{attendanceCount}</p>
                        </motion.div>

                        {/* Absent counter */}
                        {session?.status === "OPEN" && totalStudents > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.02 }}
                                className="p-3 sm:p-4 rounded-xl backdrop-blur-sm bg-red-500/20 col-span-2 sm:col-span-1"
                            >
                                <div className="flex items-center gap-1.5 text-white/70 mb-1">
                                    <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="text-[10px] sm:text-xs uppercase tracking-wide">Absent</span>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-white">{absentCount}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Live Attendance Feed (only during active session) */}
                    <AnimatePresence>
                        {session?.status === "OPEN" && recentAttendees.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                <div className="flex items-center gap-2 text-white/70 mb-3">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs uppercase tracking-wide">Recent Check-ins</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentAttendees.map((attendee, index) => (
                                        <motion.div
                                            key={attendee.id}
                                            initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white/30 overflow-hidden">
                                                <Image
                                                    src={attendee.img || "/noAvatar.png"}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-sm text-white font-medium">
                                                {attendee.name} {attendee.surname.charAt(0)}.
                                            </span>
                                            {index === 0 && (
                                                <span className="text-xs text-emerald-300">Just now</span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={session?.status === "OPEN" ? endSession : startSession}
                        disabled={loading}
                        className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 ${loading
                            ? "bg-slate-600 cursor-not-allowed"
                            : session?.status === "OPEN"
                                ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/30"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : session?.status === "OPEN" ? (
                            <>
                                <Square className="w-5 h-5" />
                                <span>End Session</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                <span>Start Session</span>
                            </>
                        )}
                    </motion.button>

                    {/* Status Message */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={session?.status || "idle"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 text-center"
                        >
                            {session?.status === "OPEN" ? (
                                <div className="flex items-center justify-center gap-2 text-white/80">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    >
                                        <Radio className="w-4 h-4" />
                                    </motion.div>
                                    <span className="text-sm">
                                        Waiting for biometric scans...
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm">
                                        Ready to start attendance session
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default AttendanceSessionControl;
