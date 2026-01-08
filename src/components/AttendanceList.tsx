"use client";

import { Student } from "@prisma/client";
import { updateAttendance } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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
    const [attendanceState, setAttendanceState] = useState(initialAttendance);
    const router = useRouter();

    const [session, setSession] = useState<{ id: number; status: string } | null>(null);
    const [loadingSession, setLoadingSession] = useState(false);

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

        // Polling for updates if session is open
        const interval = setInterval(() => {
            if (session?.status === "OPEN") {
                router.refresh();
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [lessonId, session?.status, router]);

    const handleToggleSession = async () => {
        setLoadingSession(true);
        try {
            if (session?.status === "OPEN") {
                // Close Session
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
                // Open Session
                const res = await fetch("/api/attendance/session", {
                    method: "POST",
                    body: JSON.stringify({ lessonId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setSession(data.session);
                    toast.success("Attendance Session Started");
                    toast.info("Students can now scan their fingers");
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
            const result = await updateAttendance(lessonId, studentId, present);
            if (!result.success) {
                toast.error("Failed to update attendance");
            } else {
                toast.success("Attendance updated");
                router.refresh();
            }
        } catch (error) {
            toast.error("Error updating attendance");
        }
    };

    if (role !== "admin" && role !== "teacher") {
        return null;
    }

    return (
        <div className="bg-white p-4 rounded-md mt-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Mark Attendance (Today)</h2>
                <div className="flex items-center gap-2">
                    {session?.status === "OPEN" && (
                        <span className="text-xs font-bold text-green-600 animate-pulse">
                            ● Live Session Active
                        </span>
                    )}
                    <button
                        onClick={handleToggleSession}
                        disabled={loadingSession}
                        className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors ${session?.status === "OPEN"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-500 hover:bg-blue-600"
                            } disabled:opacity-50`}
                    >
                        {loadingSession ? "Processing..." : session?.status === "OPEN" ? "End Session" : "Start Session"}
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-gray-500 font-medium border-b">
                        <tr>
                            <th className="py-2">Student</th>
                            <th className="py-2">Status</th>
                            <th className="py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => {
                            const record = attendanceState.find(
                                (a) => a.studentId === student.id
                            );
                            const isPresent = record ? record.present : false;

                            return (
                                <tr key={student.id} className="border-b last:border-none">
                                    <td className="py-3 flex items-center gap-2">
                                        {student.name} {student.surname}
                                    </td>
                                    <td className="py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs ${isPresent
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {isPresent ? "Present" : "Absent"}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <button
                                            onClick={() => handleToggle(student.id, !isPresent)}
                                            className={`px-3 py-1 rounded text-white text-xs ${isPresent ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                                                }`}
                                        >
                                            Mark {isPresent ? "Absent" : "Present"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AttendanceList;
