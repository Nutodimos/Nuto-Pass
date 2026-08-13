"use client";

import { useState } from "react";
import {
    Archive,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Search,
    ChevronDown,
    ChevronUp,
    Users,
    BookOpen,
    Filter
} from "lucide-react";

export interface ArchivedAttendee {
    id: string;
    name: string;
    surname: string;
    username: string;
    present: boolean;
    time?: string;
}

export interface ArchivedSessionRecord {
    id: number;
    courseCode: string;
    courseTitle: string;
    levelName: string;
    date: string;
    startTime: string;
    endTime: string;
    academicSession: string;
    semester: string;
    status: "OPEN" | "CLOSED";
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
    attendees: ArchivedAttendee[];
}

interface AttendanceArchiveSettingsProps {
    archivedSessions: ArchivedSessionRecord[];
    academicSessionsList: string[];
}

export default function AttendanceArchiveSettings({
    archivedSessions,
    academicSessionsList,
}: AttendanceArchiveSettingsProps) {
    const [selectedSession, setSelectedSession] = useState<string>("all");
    const [selectedSemester, setSelectedSemester] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

    // Filter sessions based on criteria
    const filteredSessions = archivedSessions.filter((item) => {
        const matchesSession =
            selectedSession === "all" || item.academicSession === selectedSession;
        const matchesSemester =
            selectedSemester === "all" || item.semester === selectedSemester;
        const matchesSearch =
            searchQuery.trim() === "" ||
            item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.levelName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSession && matchesSemester && matchesSearch;
    });

    const toggleExpand = (id: number) => {
        setExpandedSessionId(expandedSessionId === id ? null : id);
    };

    // CSV Download handler
    const downloadCSV = (session: ArchivedSessionRecord) => {
        const headers = ["Matric No / Username", "First Name", "Last Name", "Status", "Time In"];
        const rows = session.attendees.map((a) => [
            a.username,
            a.name,
            a.surname,
            a.present ? "Present" : "Absent",
            a.time || "-",
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `Attendance_${session.courseCode}_${session.date.replace(/[\s,]/g, "_")}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-CPENavy to-slate-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                            <Archive className="w-7 h-7 text-CPEGold" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Past Attendance Archives</h2>
                            <p className="text-white/80 text-sm">
                                View & export attendance history grouped per academic session and lecture session.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/10 self-start md:self-auto">
                        <span className="text-xs font-semibold uppercase tracking-wider text-CPEGold">Total Archived</span>
                        <span className="text-lg font-bold">{archivedSessions.length} Sessions</span>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by course code, title, or level (e.g. CPE 311, 300L)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-CPENavy focus:border-transparent transition-all"
                    />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-500">Session:</span>
                        <select
                            value={selectedSession}
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="py-2 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-CPENavy cursor-pointer"
                        >
                            <option value="all">All Academic Sessions</option>
                            {academicSessionsList.map((s) => (
                                <option value={s} key={s}>
                                    Academic Session {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Semester:</span>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="py-2 px-3 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-CPENavy cursor-pointer"
                        >
                            <option value="all">All Semesters</option>
                            <option value="Harmattan Semester">Harmattan Semester</option>
                            <option value="Rain Semester">Rain Semester</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Archived Sessions List */}
            {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <Archive className="w-16 h-16 text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No Archived Records Found</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                        No past attendance session records match your selected filter criteria. When new academic sessions or lecture attendance sessions are conducted, their records will automatically be archived here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSessions.map((session) => {
                        const isExpanded = expandedSessionId === session.id;

                        return (
                            <div
                                key={session.id}
                                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                            >
                                {/* Summary Card Header */}
                                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                            <BookOpen className="w-6 h-6 text-CPEGold" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-bold text-lg text-slate-800">
                                                    {session.courseCode}
                                                </h3>
                                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {session.levelName}
                                                </span>
                                                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                                    Session {session.academicSession} ({session.semester})
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-600 mb-2">
                                                {session.courseTitle}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{session.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>
                                                        {session.startTime} - {session.endTime}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats & Actions */}
                                    <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <span className="text-xl font-black text-slate-800">
                                                    {session.presentCount}
                                                </span>
                                                <span className="text-xs text-slate-400 font-bold">
                                                    / {session.totalStudents}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            session.attendancePercentage >= 75
                                                                ? "bg-emerald-500"
                                                                : session.attendancePercentage >= 50
                                                                ? "bg-amber-500"
                                                                : "bg-rose-500"
                                                        }`}
                                                        style={{
                                                            width: `${session.attendancePercentage}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {session.attendancePercentage}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => downloadCSV(session)}
                                                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-CPENavy transition-colors"
                                                title="Export Attendance to CSV"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleExpand(session.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
                                            >
                                                <span>{isExpanded ? "Hide" : "Roster"}</span>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Roster List */}
                                {isExpanded && (
                                    <div className="bg-slate-50 p-5 border-t border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                <Users className="w-4 h-4 text-CPENavy" />
                                                Session Roster ({session.attendees.length} Students)
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs font-semibold">
                                                <span className="text-emerald-700 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Present: {session.presentCount}
                                                </span>
                                                <span className="text-rose-600 flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5" /> Absent: {session.absentCount}
                                                </span>
                                            </div>
                                        </div>

                                        {session.attendees.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic">No attendee records found for this session.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {session.attendees.map((student) => (
                                                    <div
                                                        key={student.id}
                                                        className={`p-3 rounded-xl border flex items-center justify-between ${
                                                            student.present
                                                                ? "bg-white border-emerald-200 shadow-sm"
                                                                : "bg-white/60 border-slate-200 text-slate-400"
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className="font-bold text-xs text-slate-800 leading-tight">
                                                                {student.name} {student.surname}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 font-mono">
                                                                {student.username}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            {student.present ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                        <CheckCircle2 className="w-3 h-3" /> Present
                                                                    </span>
                                                                    {student.time && (
                                                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                                                            {student.time}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                                                    <XCircle className="w-3 h-3" /> Absent
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
