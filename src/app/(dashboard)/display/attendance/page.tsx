"use client";

import { Users, BookOpen, CheckCircle2, XCircle, UserCheck } from "lucide-react";

const MOCK_ATTENDANCE = [
    { id: "1", name: "John Doe", username: "CPE/2019/001", status: "present", time: "08:15 AM" },
    { id: "2", name: "Jane Smith", username: "CPE/2019/002", status: "present", time: "08:22 AM" },
    { id: "3", name: "Michael Johnson", username: "CPE/2019/003", status: "absent", time: "-" },
    { id: "4", name: "Sarah Williams", username: "CPE/2019/004", status: "present", time: "08:05 AM" },
];

export default function AttendanceDisplay() {
    return (
        <div className="flex-1 p-4 flex flex-col gap-6 bg-slate-50/50 min-h-screen">
            {/* HERO BANNER */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-8 rounded-3xl shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full pointer-events-none filter blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex flex-col items-center justify-center backdrop-blur-sm border border-white/20">
                            <UserCheck className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-white">
                            <h1 className="text-3xl font-bold tracking-tight">CPE 401 Attendance</h1>
                            <p className="text-white/80 font-medium mt-1">Computer Architecture</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Total Enrolled</p>
                        <h2 className="text-3xl font-bold text-slate-800">45</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-slate-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Present</p>
                        <h2 className="text-3xl font-bold text-emerald-600">42</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-500 mb-1">Absent</p>
                        <h2 className="text-3xl font-bold text-rose-600">3</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-rose-500" />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Today&apos;s Log</h3>
                    <span className="text-sm text-slate-500 font-medium">Aug 7, 2026</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Matric No</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Time In</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_ATTENDANCE.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{record.name}</td>
                                    <td className="px-6 py-4 text-slate-500">{record.username}</td>
                                    <td className="px-6 py-4">
                                        {record.status === "present" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                Present
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                Absent
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-medium">{record.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
