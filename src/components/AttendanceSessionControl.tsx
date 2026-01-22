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
} from "lucide-react";
import { toast } from "react-toastify";

interface AttendanceSessionControlProps {
    lessonId: number;
    lessonName: string;
    className: string;
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
}: AttendanceSessionControlProps) => {
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [attendanceCount, setAttendanceCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState("00:00:00");
    const [recentAttendees, setRecentAttendees] = useState<AttendanceRecord[]>([]);

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, [lessonId]);

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

    const checkExistingSession = async () => {
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
    };

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
                toast.success("✅ Session ended successfully!", {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative overflow-hidden"
        >
            {/* Main Control Card */}
            <div
                className={`relative rounded-2xl p-6 shadow-2xl transition-all duration-500 ${session?.status === "OPEN"
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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <motion.div
                                animate={session?.status === "OPEN" ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`p-3 rounded-xl ${session?.status === "OPEN"
                                        ? "bg-white/20 text-white"
                                        : "bg-slate-700 text-slate-400"
                                    }`}
                            >
                                <Fingerprint className="w-6 h-6" />
                            </motion.div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{lessonName}</h2>
                                <p className="text-sm text-white/70">{className}</p>
                            </div>
                        </div>

                        {/* Live Indicator */}
                        <AnimatePresence>
                            {session?.status === "OPEN" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full"
                                >
                                    <motion.div
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-3 h-3 bg-red-500 rounded-full"
                                    />
                                    <span className="text-sm font-semibold text-white">LIVE</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl backdrop-blur-sm ${session?.status === "OPEN"
                                    ? "bg-white/20"
                                    : "bg-slate-700/50"
                                }`}
                        >
                            <div className="flex items-center gap-2 text-white/70 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wide">Duration</span>
                            </div>
                            <p className="text-2xl font-mono font-bold text-white">{elapsedTime}</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 rounded-xl backdrop-blur-sm ${session?.status === "OPEN"
                                    ? "bg-white/20"
                                    : "bg-slate-700/50"
                                }`}
                        >
                            <div className="flex items-center gap-2 text-white/70 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wide">Scanned</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{attendanceCount}</p>
                        </motion.div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={session?.status === "OPEN" ? endSession : startSession}
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${loading
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
