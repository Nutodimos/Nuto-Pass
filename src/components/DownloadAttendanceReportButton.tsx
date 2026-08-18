"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

export interface AttendanceStudentRow {
    id: string;
    username: string;
    name: string;
    surname: string;
    className?: string;
    totalSessions: number;
    presentSessions: number;
    absentSessions?: number;
    percentage: number | string;
    eligibility?: string;
    biometricId?: string | null;
}

export interface StudentCourseRow {
    courseCode: string;
    courseTitle?: string;
    lecturer?: string;
    totalClasses: number;
    attendedClasses: number;
    percentage: number | string;
    status: string;
}

interface DownloadAttendanceReportButtonProps {
    type: "course" | "class" | "student" | "summary";
    title: string;
    subtitle?: string;
    sessionYear?: string;
    semester?: string;
    data?: AttendanceStudentRow[];
    studentCoursesData?: StudentCourseRow[];
    studentDetails?: {
        name: string;
        username: string;
        className?: string;
    };
    fileName?: string;
    variant?: "primary" | "secondary" | "outline";
    buttonText?: string;
}

export default function DownloadAttendanceReportButton({
    type,
    title,
    subtitle,
    sessionYear,
    semester,
    data = [],
    studentCoursesData = [],
    studentDetails,
    fileName,
    variant = "primary",
    buttonText = "Download Attendance Report",
}: DownloadAttendanceReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = () => {
        setIsGenerating(true);
        try {
            const timestamp = new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            });

            let csvLines: string[] = [];

            // Add Header metadata
            csvLines.push(`"ATTENDANCE REPORT - ${title.toUpperCase()}"`);
            if (subtitle) csvLines.push(`"${subtitle}"`);
            if (sessionYear || semester) {
                csvLines.push(`"Academic Session: ${sessionYear || "N/A"}"`);
                csvLines.push(`"Semester / Term: ${semester || "N/A"}"`);
            }
            csvLines.push(`"Report Generated: ${timestamp}"`);
            csvLines.push(""); // Empty line separator

            if (type === "course") {
                // Summary calculation
                const totalStudents = data.length;
                const eligibleStudents = data.filter(
                    (d) => Number(d.percentage) >= 70
                ).length;
                const avgAttendance =
                    totalStudents > 0
                        ? (
                              data.reduce(
                                  (acc, cur) => acc + Number(cur.percentage || 0),
                                  0
                              ) / totalStudents
                          ).toFixed(1)
                        : "0.0";

                csvLines.push(`"SUMMARY STATISTICS"`);
                csvLines.push(`"Total Enrolled Students:","${totalStudents}"`);
                csvLines.push(
                    `"Eligible for Examination (>=70%):","${eligibleStudents} / ${totalStudents} (${
                        totalStudents > 0
                            ? Math.round((eligibleStudents / totalStudents) * 100)
                            : 0
                    }%)"`
                );
                csvLines.push(`"Average Class Attendance:","${avgAttendance}%"`);
                csvLines.push("");

                // Table Columns
                csvLines.push(
                    [
                        '"S/N"',
                        '"Matric No / Student ID"',
                        '"First Name"',
                        '"Last Name"',
                        '"Level / Class"',
                        '"Total Sessions"',
                        '"Sessions Present"',
                        '"Sessions Absent"',
                        '"Attendance Rate (%)"',
                        '"Exam Eligibility (>=70%)"',
                    ].join(",")
                );

                // Table Rows
                data.forEach((student, index) => {
                    const present = Number(student.presentSessions || 0);
                    const total = Number(student.totalSessions || 0);
                    const absent = student.absentSessions !== undefined ? student.absentSessions : Math.max(0, total - present);
                    const pct = Number(student.percentage || 0);
                    const isEligible = pct >= 70 ? "ELIGIBLE" : "INELIGIBLE";

                    csvLines.push(
                        [
                            `"${index + 1}"`,
                            `"${student.username || student.id}"`,
                            `"${student.name.replace(/"/g, '""')}"`,
                            `"${student.surname.replace(/"/g, '""')}"`,
                            `"${(student.className || "N/A").replace(/"/g, '""')}"`,
                            `"${total}"`,
                            `"${present}"`,
                            `"${absent}"`,
                            `"${pct}%"`,
                            `"${isEligible}"`,
                        ].join(",")
                    );
                });
            } else if (type === "class") {
                const totalStudents = data.length;
                csvLines.push(`"Total Students in Level:","${totalStudents}"`);
                csvLines.push("");

                csvLines.push(
                    [
                        '"S/N"',
                        '"Matric No / ID"',
                        '"First Name"',
                        '"Last Name"',
                        '"Biometric Registered"',
                        '"Total Sessions"',
                        '"Present Count"',
                        '"Absent Count"',
                        '"Attendance Rate (%)"',
                    ].join(",")
                );

                data.forEach((student, index) => {
                    const present = Number(student.presentSessions || 0);
                    const total = Number(student.totalSessions || 0);
                    const absent = student.absentSessions !== undefined ? student.absentSessions : Math.max(0, total - present);
                    const pct = Number(student.percentage || 0);
                    const bioStatus = student.biometricId ? "Yes" : "No";

                    csvLines.push(
                        [
                            `"${index + 1}"`,
                            `"${student.username || student.id}"`,
                            `"${student.name.replace(/"/g, '""')}"`,
                            `"${student.surname.replace(/"/g, '""')}"`,
                            `"${bioStatus}"`,
                            `"${total}"`,
                            `"${present}"`,
                            `"${absent}"`,
                            `"${pct}%"`,
                        ].join(",")
                    );
                });
            } else if (type === "student") {
                if (studentDetails) {
                    csvLines.push(`"Student Name:","${studentDetails.name}"`);
                    csvLines.push(`"Matric No / ID:","${studentDetails.username}"`);
                    if (studentDetails.className) {
                        csvLines.push(`"Level / Class:","${studentDetails.className}"`);
                    }
                    csvLines.push("");
                }

                csvLines.push(
                    [
                        '"S/N"',
                        '"Course Code"',
                        '"Course Title"',
                        '"Lecturer / Teacher"',
                        '"Total Classes Held"',
                        '"Classes Attended"',
                        '"Attendance Rate (%)"',
                        '"Status"',
                    ].join(",")
                );

                studentCoursesData.forEach((course, index) => {
                    csvLines.push(
                        [
                            `"${index + 1}"`,
                            `"${course.courseCode}"`,
                            `"${(course.courseTitle || "").replace(/"/g, '""')}"`,
                            `"${(course.lecturer || "Assigned Lecturer").replace(/"/g, '""')}"`,
                            `"${course.totalClasses}"`,
                            `"${course.attendedClasses}"`,
                            `"${course.percentage}%"`,
                            `"${course.status}"`,
                        ].join(",")
                    );
                });
            }

            // UTF-8 BOM for Excel support
            const BOM = "\uFEFF";
            const csvContent = BOM + csvLines.join("\r\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const downloadName =
                fileName ||
                `Attendance_Report_${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date()
                    .toISOString()
                    .slice(0, 10)}.csv`;

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", downloadName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Attendance report downloaded successfully!");
        } catch (err: any) {
            console.error("Failed to export attendance report:", err);
            toast.error("Failed to generate report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const variantStyles = {
        primary:
            "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm hover:shadow-md",
        secondary:
            "bg-CPENavy hover:bg-CPENavyDark text-white shadow-sm hover:shadow-md",
        outline:
            "bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50",
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles[variant]}`}
            title="Download formatted attendance CSV report"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                </>
            ) : (
                <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{buttonText}</span>
                </>
            )}
        </button>
    );
}
