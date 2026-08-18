"use client";

import { useState, useEffect, useRef } from "react";
import {
    Fingerprint,
    Wifi,
    Zap,
    Activity,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    User,
    RefreshCw,
    Cpu,
    Database,
    Clock,
    Signal,
    ChevronRight,
    Settings2,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import BiometricRegistrationButton from "./BiometricRegistrationButton";

interface DeviceStatus {
    status: "online" | "idle" | "offline";
    lastSeen: string | null;
    lastSeenAgo: number;
    mode: string;
    wifiRSSI: number | null;
    freeHeap: number | null;
    sensorStatus: boolean;
    uptime: number;
}

interface Student {
    id: string;
    name: string;
    surname: string;
    biometricId: string | null;
    img: string | null;
    class: { name: string };
}

const BiometricHub = () => {
    const { user } = useUser();
    const role = (user?.publicMetadata?.role as string) || "guest";

    const [device, setDevice] = useState<DeviceStatus | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "students" | "logs">("overview");
    const [isWiping, setIsWiping] = useState(false);

    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    const fetchData = async () => {
        try {
            const [deviceRes, studentRes] = await Promise.all([
                fetch("/api/esp32/events"),
                fetch("/api/student/biometric/list")
            ]);

            if (deviceRes.ok) {
                const data = await deviceRes.json();
                setDevice(data.device);
            }

            if (studentRes.ok) {
                const data = await studentRes.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Error fetching biometric data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        refreshInterval.current = setInterval(fetchData, 5000);
        return () => {
            if (refreshInterval.current) clearInterval(refreshInterval.current);
        };
    }, []);

    const handleWipe = async () => {
        if (!confirm("⚠️ FINAL WARNING: This will permanently erase all fingerprint templates from the sensor and break all student links. Continue?")) return;

        setIsWiping(true);
        try {
            const res = await fetch("/api/student/biometric/wipe", { method: "POST" });
            if (res.ok) {
                toast.success("Wipe command sent to device");
                fetchData();
            } else {
                toast.error("Failed to initiate wipe");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsWiping(false);
        }
    };

    const filteredStudents = students.filter(s =>
        `${s.name} ${s.surname}`.toLowerCase().includes(search.toLowerCase()) ||
        s.biometricId?.toLowerCase().includes(search.toLowerCase())
    );

    const enrolledCount = students.filter(s => !!s.biometricId && !s.biometricId.startsWith("PENDING-")).length;

    if (loading && !device) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Activity className="w-8 h-8 text-CPENavy animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-CPENavyDark tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-CPEGold" />
                        Biometric Hub
                    </h1>
                    <p className="text-slate-500 font-medium">Command center for the Biometric Attendance Module</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchData()}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-CPENavy hover:border-CPENavy transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold text-xs uppercase tracking-widest ${device?.status === "online" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                        device?.status === "idle" ? "bg-amber-50 border-amber-100 text-amber-600" :
                            "bg-red-50 border-red-100 text-red-600"
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${device?.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-current"}`} />
                        Device {device?.status || "offline"}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    label="Cloud Templates"
                    value={enrolledCount.toString()}
                    subValue={`${students.length - enrolledCount} not enrolled`}
                    icon={<Database className="w-5 h-5" />}
                    color="text-indigo-600"
                    bgColor="bg-indigo-50"
                />
                <StatCard
                    label="Students Linked"
                    value={enrolledCount.toString()}
                    subValue={`${students.length - enrolledCount} pending`}
                    icon={<Fingerprint className="w-5 h-5" />}
                    color="text-CPEGold"
                    bgColor="bg-CPEGold/10"
                />
                <StatCard
                    label="Signal"
                    value={device?.wifiRSSI ? `${device.wifiRSSI} dBm` : "N/A"}
                    subValue={device?.wifiRSSI && device.wifiRSSI > -60 ? "Strong" : device?.wifiRSSI ? "Weak" : "No signal"}
                    icon={<Signal className="w-5 h-5" />}
                    color="text-emerald-600"
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    label="Active Mode"
                    value={device?.mode || "Unknown"}
                    subValue={`Uptime: ${Math.floor((device?.uptime || 0) / 3600)}h ${Math.floor(((device?.uptime || 0) % 3600) / 60)}m`}
                    icon={<Zap className="w-5 h-5" />}
                    color="text-CPENavy"
                    bgColor="bg-CPENavy/5"
                />
            </div>

            {/* Main Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                {(["overview", "students", "logs"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeTab === tab
                            ? "bg-white text-CPENavy shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* Hardware Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-indigo-500" />
                                        Hardware Diagnostics
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ESP32-WROOM-32</span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <DiagItem label="Free Heap" value={device?.freeHeap ? `${Math.round(device.freeHeap / 1024)} KB` : "N/A"} icon={<Settings2 className="w-4 h-4 text-slate-400" />} />
                                    <DiagItem label="Sensor Health" value={device?.sensorStatus ? "Healthy" : "Check Wiring!"} icon={<Activity className="w-4 h-4 text-emerald-500" />} status={device?.sensorStatus ? "success" : "error"} />
                                    <DiagItem label="Last Seen" value={device?.lastSeenAgo !== undefined ? `${device.lastSeenAgo}s ago` : "N/A"} icon={<Clock className="w-4 h-4 text-slate-400" />} />
                                    <DiagItem label="SD Card" value="Ready" icon={<Database className="w-4 h-4 text-slate-400" />} />
                                </div>

                                {role === "admin" && (
                                    <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-4">
                                        <button
                                            disabled={isWiping || device?.status === "offline"}
                                            onClick={handleWipe}
                                            className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Emergency Wipe All Data
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Enrollment Status */}
                            <div className="bg-gradient-to-br from-CPENavy to-CPENavyDark rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
                                            <circle
                                                cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="8"
                                                strokeDasharray={377}
                                                strokeDashoffset={students.length > 0 ? 377 - (377 * enrolledCount) / students.length : 377}
                                                className="text-CPEGold transition-all duration-1000"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black">{enrolledCount}</span>
                                            <span className="text-[10px] font-bold text-white/50 uppercase">Enrolled</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <h4 className="text-xl font-bold">Enrollment Status</h4>
                                        <p className="text-white/60 text-sm leading-relaxed max-w-md">
                                            {enrolledCount} of {students.length} students have fingerprints stored on the sensor.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Events (Small Version) */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    Live Stream
                                </h3>
                                <button className="text-[10px] font-black text-CPENavy uppercase tracking-wider hover:underline" onClick={() => setActiveTab("logs")}>View All</button>
                            </div>
                            <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <Fingerprint className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-slate-800 truncate">Unknown Scan</p>
                                                <span className="text-[10px] text-slate-400 shrink-0">2m ago</span>
                                            </div>
                                            <p className="text-xs text-red-500 font-medium">REJECTED (Code 9)</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "students" && (
                    <motion.div
                        key="students"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search student or biometric ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-CPENavy/10 focus:border-CPENavy outline-none transition-all text-sm"
                                />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {filteredStudents.length} Students</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredStudents.map(student => (
                                <div key={student.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-CPENavy/20 transition-all">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative border-2 border-slate-100 shadow-sm">
                                        <Image
                                            src={student.img || "/noAvatar.png"}
                                            alt={student.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <h4 className="font-bold text-slate-800 truncate">{student.name} {student.surname}</h4>
                                            {student.biometricId && !student.biometricId.startsWith("PENDING-") && (
                                                <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">{student.class.name} • {(student.biometricId && !student.biometricId.startsWith("PENDING-")) ? student.biometricId : "Unregistered"}</p>
                                    </div>
                                    <BiometricRegistrationButton studentId={student.id} hasBiometric={!!student.biometricId && !student.biometricId.startsWith("PENDING-")} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === "logs" && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Advanced Log Feed</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">Real-time attendance streams and security audits will appear here. Currently syncing with ESP32 logs...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ label, value, subValue, icon, color, bgColor }: any) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgColor} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-1">{subValue}</p>
        </div>
    </div>
);

const DiagItem = ({ label, value, icon, status }: any) => (
    <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-sm font-bold ${status === "success" ? "text-emerald-600" :
                status === "error" ? "text-red-500" : "text-slate-700"
                }`}>{value}</p>
        </div>
    </div>
);

export default BiometricHub;
