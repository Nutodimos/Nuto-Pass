"use client";

import { Student } from "@prisma/client";
import { updateAttendance } from "@/lib/actions";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import { Calendar as CalendarIcon, Search, AlertCircle, Download } from "lucide-react";

type AttendanceListProps = {
    lessonId: number;
    students: Student[];
    initialAttendance: { studentId: string; present: boolean }[];
    role?: string;
};

const AttendanceList = ({
    lessonId,
    students,
    initialAttendance,
    role,
}: AttendanceListProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlDate = searchParams.get("date");

    // --- State ---
    const [attendanceState, setAttendanceState] = useState(initialAttendance);
    const [selectedDate, setSelectedDate] = useState<string>(urlDate || new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState("");

    const pathname = usePathname();

    // Sync selectedDate with URL changes
    useEffect(() => {
        if (urlDate) {
            setSelectedDate(urlDate);
        } else {
            setSelectedDate(new Date().toISOString().split('T')[0]);
        }
    }, [urlDate]);

    // Live Session State
    const [session, setSession] = useState<{ id: number; status: string } | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);

    // Loading State for History
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Check if the selected date is today
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // --- Session Effects ---
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch(`/api/attendance/session?lessonId=${lessonId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSession(data);
                }
            } catch (err) {
                console.error("Failed to fetch session", err);
            }
        };
        fetchSession();

        const interval = setInterval(() => {
            if (session?.status === "OPEN" && isToday) {
                router.refresh();
                // Note: We might want a more targeted refresh here for just attendance data,
                // but router.refresh() will re-pull initialAttendance which we'd then need to sync.
                // For now, if the session is open, we let NextJS handle the data hydration.
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [lessonId, session?.status, router, isToday]);

    // --- History Fetching Effect ---
    useEffect(() => {
        const fetchHistoricalAttendance = async () => {
            if (isToday) {
                // Return to initial props state or let server action handle it
                // We don't necessarily want to wipe local optimistic updates if it's today
                setIsLoadingHistory(true);
                try {
                    const res = await fetch(`/api/attendance/history?lessonId=${lessonId}&date=${selectedDate}`);
                    if (res.ok) {
                        const data = await res.json();
                        setAttendanceState(data);
                    }
                } finally {
                    setIsLoadingHistory(false);
                }
                return;
            }

            setIsLoadingHistory(true);
            try {
                const res = await fetch(`/api/attendance/history?lessonId=${lessonId}&date=${selectedDate}`);
                if (res.ok) {
                    const data = await res.json();
                    setAttendanceState(data);
                } else {
                    toast.error("Failed to load historical data");
                }
            } catch (err) {
                toast.error("Error loading historical data");
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistoricalAttendance();
    }, [selectedDate, lessonId, isToday]);

    // --- Actions ---
    const handleToggleSession = async () => {
        setLoadingSession(true);
        try {
            if (session?.status === "OPEN") {
                const res = await fetch("/api/attendance/session", {
                    method: "PUT",
                    body: JSON.stringify({ sessionId: session.id }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.session);
                    toast.success("Attendance Session Closed");
                }
            } else {
                const res = await fetch("/api/attendance/session", {
                    method: "POST",
                    body: JSON.stringify({ lessonId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.session);
                    toast.success("Attendance Session Started");
                    // Force date to today if starting a live session by clearing URL param
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                    router.push(pathname, { scroll: false });
                }
            }
        } catch (error) {
            toast.error("Failed to toggle session");
        } finally {
            setLoadingSession(false);
            router.refresh();
        }
    };

    const handleToggle = async (studentId: string, present: boolean) => {
        // Optimistic update
        setAttendanceState((prev) => {
            const existing = prev.find((a) => a.studentId === studentId);
            if (existing) {
                return prev.map((a) =>
                    a.studentId === studentId ? { ...a, present } : a
                );
            }
            return [...prev, { studentId, present }];
        });

        try {
            // Pass the selectedDate to save it historically
            const result = await updateAttendance(lessonId, studentId, present, selectedDate);
            if (!result.success) {
                toast.error("Failed to update attendance");
                // Note: Realistically should rollback optimistic update here
            } else {
                toast.success(isToday ? "Attendance updated" : "Historical record updated");
                if (isToday) router.refresh();
            }
        } catch (error) {
            toast.error("Error updating attendance");
        }
    };

    // --- Filtering ---
    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        const lowercaseQuery = searchQuery.toLowerCase();
        return students.filter(
            (student) =>
                student.name.toLowerCase().includes(lowercaseQuery) ||
                student.surname.toLowerCase().includes(lowercaseQuery) ||
                student.username.toLowerCase().includes(lowercaseQuery)
        );
    }, [students, searchQuery]);

    // --- CSV Export ---
    const handleDownloadCSV = () => {
        const headers = ["Student ID,First Name,Last Name,Attendance Status"];
        const rows = filteredStudents.map(student => {
            const record = attendanceState.find((a) => a.studentId === student.id);
            const status = record?.present ? "Present" : "Absent";
            // Escape names just in case they have commas
            return `"${student.username}","${student.name}","${student.surname}","${status}"`;
        });

        const csvContent = headers.concat(rows).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_Class_${lessonId}_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (role !== "admin" && role !== "teacher") {
        return null;
    }

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* Header Controls Row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">

                {/* Read-Only Date Display */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-nutoSlate shadow-sm">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Viewing Date</label>
                        <span className="text-sm font-semibold text-slate-800">
                            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    {!isToday && (
                        <span className="ml-2 px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md border border-amber-200 flex items-center gap-1 cursor-help" title="Click 'Today' on the right calendar to return">
                            <AlertCircle className="w-3 h-3" /> Historical
                        </span>
                    )}
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 xl:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-nutoOrange/20 focus:border-nutoOrange transition-all shadow-sm"
                        />
                    </div>

                    {/* Download CSV Button */}
                    <button
                        onClick={handleDownloadCSV}
                        title="Download CSV for current list"
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-nutoSlate hover:border-nutoSlate/30 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    {/* Live Session Button */}
                    <button
                        onClick={handleToggleSession}
                        disabled={loadingSession || !isToday}
                        title={!isToday ? "Live sessions can only be started for Today" : ""}
                        className={`px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2 whitespace-nowrap ${session?.status === "OPEN"
                            ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-emerald-500/25"
                            }`}
                    >
                        {loadingSession ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Wait...
                            </span>
                        ) : session?.status === "OPEN" ? (
                            "End Live"
                        ) : (
                            "Start Live"
                        )}
                    </button>
                </div>
            </div>

            {/* Live Indicator (Only if active and viewing today) */}
            {session?.status === "OPEN" && isToday && (
                <div className="flex items-center gap-2 text-sm font-bold text-nutoOrange animate-pulse bg-nutoOrange/5 px-4 py-2 rounded-xl border border-nutoOrange/20 -mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-nutoOrange shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                    Live Biometric Session Active — Students can scan fingers now
                </div>
            )}

            {/* Roster List */}
            <div className="flex flex-col gap-3 relative">
                {/* Loading Overlay for History */}
                {isLoadingHistory && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl border border-slate-100">
                        <div className="flex flex-col items-center gap-2 text-nutoSlate font-semibold">
                            <div className="w-6 h-6 border-2 border-nutoSlate/30 border-t-nutoSlate rounded-full animate-spin"></div>
                            Loading Date...
                        </div>
                    </div>
                )}

                {filteredStudents.map((student) => {
                    const record = attendanceState.find(
                        (a) => a.studentId === student.id
                    );
                    const isPresent = record ? record.present : false;

                    return (
                        <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all group ${isToday ? "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-sm" : "bg-amber-50/30 border-amber-100 hover:bg-amber-50"
                            }`}>
                            <div className="flex items-center gap-4">
                                {/* Initial Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${isPresent ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 border border-slate-200"}`}>
                                    {student.name[0]}{student.surname[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800">{student.name} {student.surname}</span>
                                    <span className="text-xs text-slate-500">ID: {student.username}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Status Badge */}
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${isPresent
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-600 border border-red-100"
                                    }`}>
                                    {isPresent ? "Present" : "Absent"}
                                </span>

                                {/* Action Toggle */}
                                <button
                                    onClick={() => handleToggle(student.id, !isPresent)}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors active:scale-95 outline-none focus:ring-2 focus:ring-offset-2 ${isPresent ? "bg-emerald-500 focus:ring-emerald-500" : "bg-slate-300 focus:ring-slate-400"
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isPresent ? "translate-x-6" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {searchQuery ? "No students match your search." : "No students enrolled in this class."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceList;

