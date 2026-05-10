"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Cpu,
    Wifi,
    WifiOff,
    HardDrive,
    Activity,
    Fingerprint,
    CheckCircle2,
    XCircle,
    Clock,
    Signal,
    MemoryStick,
    Timer,
} from "lucide-react";
import Image from "next/image";

interface DeviceInfo {
    status: "online" | "idle" | "offline";
    lastSeen: string | null;
    lastSeenAgo: number;
    mode: string;
    wifiRSSI: number | null;
    freeHeap: number | null;
    sdReady: boolean;
    uptime: number;
}

interface ScanEvent {
    id: number;
    studentName: string;
    studentImg: string | null;
    biometricId: string | null;
    lessonName: string;
    present: boolean;
    timestamp: string;
}

interface EventsData {
    device: DeviceInfo;
    stats: {
        totalScans: number;
        successfulScans: number;
        failedScans: number;
    };
    recentEvents: ScanEvent[];
}

const statusConfig = {
    online: {
        label: "Online",
        color: "bg-emerald-500",
        glow: "shadow-emerald-500/50",
        text: "text-emerald-400",
        bg: "bg-emerald-500/20",
    },
    idle: {
        label: "Idle",
        color: "bg-amber-500",
        glow: "shadow-amber-500/50",
        text: "text-amber-400",
        bg: "bg-amber-500/20",
    },
    offline: {
        label: "Offline",
        color: "bg-red-500",
        glow: "shadow-red-500/50",
        text: "text-red-400",
        bg: "bg-red-500/20",
    },
};

function formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function formatTimeAgo(seconds: number): string {
    if (seconds < 0) return "never";
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

function formatScanTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

const DeviceStatusCard = () => {
    const [data, setData] = useState<EventsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/esp32/events");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            setData(json);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const device = data?.device;
    const stats = data?.stats;
    const events = data?.recentEvents || [];
    const sc = statusConfig[device?.status || "offline"];

    // Loading state
    if (loading && !data) {
        return (
            <div className="group cpe-card p-6">
                <div className="cpe-card-indicator"></div>
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group cpe-card overflow-hidden"
        >
            <div className="cpe-card-indicator"></div>

            {/* ── Header with gradient ── */}
            <div className="relative p-5 bg-gradient-to-br from-CPENavy to-CPENavyDark overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-CPEGold/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={
                                device?.status === "online"
                                    ? { scale: [1, 1.1, 1] }
                                    : {}
                            }
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="p-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/10"
                        >
                            <Cpu className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">
                                Device Monitor
                            </h3>
                            <p className="text-xs text-white/60 font-medium">
                                ESP32 Biometric Terminal
                            </p>
                        </div>
                    </div>

                    {/* Status badge */}
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${sc.bg} backdrop-blur-sm border border-white/10`}
                    >
                        <motion.div
                            animate={
                                device?.status === "online"
                                    ? { opacity: [1, 0.4, 1] }
                                    : {}
                            }
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className={`w-2 h-2 rounded-full ${sc.color} shadow-sm ${sc.glow}`}
                        />
                        <span className="text-xs font-semibold text-white">
                            {sc.label}
                        </span>
                    </div>
                </div>

                {/* Last seen */}
                {device?.lastSeen && (
                    <div className="relative z-10 mt-3 flex items-center gap-1.5 text-white/50">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px] font-medium">
                            Last seen {formatTimeAgo(device.lastSeenAgo)}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Stats Grid ── */}
            <div className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100"
                        style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}>
                        <div className="flex items-center justify-center mb-1.5">
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(var(--cpe-slate-rgb), 0.1)" }}>
                                <Fingerprint className="w-3.5 h-3.5 text-CPENavy" style={{ color: "rgb(var(--cpe-slate-rgb))" }} />
                            </div>
                        </div>
                        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                            {stats?.totalScans ?? 0}
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                            Total
                        </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100"
                        style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.15)" }}>
                        <div className="flex items-center justify-center mb-1.5">
                            <div className="p-1.5 rounded-lg bg-emerald-100" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">
                            {stats?.successfulScans ?? 0}
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                            Success
                        </p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-50 border border-red-100"
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.15)" }}>
                        <div className="flex items-center justify-center mb-1.5">
                            <div className="p-1.5 rounded-lg bg-red-100" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}>
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-red-500">
                            {stats?.failedScans ?? 0}
                        </p>
                        <p className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                            Failed
                        </p>
                    </div>
                </div>

                {/* ── Device Vitals (compact row) ── */}
                {device?.status !== "offline" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mb-4"
                    >
                        <div className="flex items-center gap-1.5 mb-2">
                            <Activity className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                                Device Vitals
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                {device?.status === "online" ? (
                                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                    <WifiOff className="w-3.5 h-3.5 text-red-400" />
                                )}
                                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                    {device?.wifiRSSI ? `${device.wifiRSSI} dBm` : "WiFi"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                <HardDrive className="w-3.5 h-3.5" style={{ color: device?.sdReady ? "#10b981" : "#ef4444" }} />
                                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                    SD {device?.sdReady ? "Ready" : "Error"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                <Timer className="w-3.5 h-3.5" style={{ color: "rgb(var(--cpe-slate-rgb))" }} />
                                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                    {formatUptime(device?.uptime || 0)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                <Signal className="w-3.5 h-3.5" style={{ color: "rgb(var(--cpe-slate-rgb))" }} />
                                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                    {device?.mode || "—"}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Recent Scan Feed ── */}
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Fingerprint className="w-3 h-3" style={{ color: "var(--text-tertiary)" }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                            Recent Scans
                        </span>
                    </div>

                    {events.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-6 rounded-xl border border-dashed"
                            style={{
                                borderColor: "var(--border-primary)",
                                backgroundColor: "var(--bg-subtle)",
                            }}
                        >
                            <Fingerprint
                                className="w-8 h-8 mb-2"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                No scans today
                            </p>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Waiting for biometric events...
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                            <AnimatePresence>
                                {events.map((event, index) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors hover:bg-slate-50"
                                        style={{
                                            backgroundColor: index === 0 ? "var(--bg-subtle)" : "transparent",
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200"
                                            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-primary)" }}>
                                            <Image
                                                src={event.studentImg || "/noAvatar.png"}
                                                alt=""
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                {event.studentName}
                                            </p>
                                            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                                                {event.lessonName}
                                            </p>
                                        </div>
                                        {/* Status + Time */}
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <span
                                                className={`text-[10px] font-bold ${event.present ? "text-emerald-500" : "text-red-400"
                                                    }`}
                                            >
                                                {event.present ? "✓" : "✕"}
                                            </span>
                                            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                                                {formatScanTime(event.timestamp)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ── Error state ── */}
                {error && (
                    <div className="mt-3 text-center">
                        <p className="text-xs text-red-400 font-medium">
                            Unable to reach device API
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DeviceStatusCard;
