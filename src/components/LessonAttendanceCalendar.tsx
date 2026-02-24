"use client";

import { useState, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Image from "next/image";
import Link from "next/link";
import { Users, UserCheck, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type AttendanceRecord = {
    id: number;
    date: Date;
    present: boolean;
    student: {
        id: string;
        name: string;
        surname: string;
        username: string; // Used for linking to student profile
    }
};

const LessonAttendanceCalendar = ({
    attendance,
    lessonId
}: {
    attendance: AttendanceRecord[];
    lessonId: number;
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [value, onChange] = useState<Date | null>(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Group attendance by date string (YYYY-MM-DD)
    const groupedAttendance = useMemo(() => {
        const groups: Record<string, AttendanceRecord[]> = {};
        attendance.forEach(record => {
            const dateStr = new Date(record.date).toDateString();
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(record);
        });
        return groups;
    }, [attendance]);

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const dateStr = date.toDateString();
            const dayRecords = groupedAttendance[dateStr];

            if (dayRecords && dayRecords.length > 0) {
                // Calculate percentage
                const presentCount = dayRecords.filter(r => r.present).length;
                const percentage = (presentCount / dayRecords.length) * 100;

                // Thresholds for colors
                if (percentage >= 80) return "attendance-excellent";
                if (percentage >= 50) return "attendance-average";
                return "attendance-poor";
            }
        }
        return null;
    };

    const handleDateClick = (val: Date) => {
        const dateStr = val.toDateString();
        const dayRecords = groupedAttendance[dateStr];

        onChange(val);
        setSelectedDate(val);

        // Update URL to sync with Roster
        const params = new URLSearchParams(searchParams.toString());
        const ISODate = new Date(val.getTime() - (val.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        params.set("date", ISODate);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });

        if (dayRecords && dayRecords.length > 0) {
            setIsModalOpen(true);
        }
    };

    const selectedRecords = useMemo(() => {
        return groupedAttendance[selectedDate.toDateString()] || [];
    }, [selectedDate, groupedAttendance]);

    const presentCount = selectedRecords.filter(r => r.present).length;
    const totalCount = selectedRecords.length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    return (
        <div className="h-full flex flex-col items-center w-full">
            <style jsx global>{`
                /* Beautiful Custom Calendar Styling */
                .react-calendar {
                    border: none;
                    width: 100%;
                    font-family: inherit;
                    background: transparent;
                }
                .react-calendar__navigation button {
                    min-width: 44px;
                    background: none;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b; 
                    border-radius: 8px;
                }
                .react-calendar__navigation button:hover {
                    background-color: #f1f5f9;
                }
                .react-calendar__month-view__weekdays {
                    font-weight: 700;
                    font-size: 0.75rem;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none;
                }
                .react-calendar__tile {
                    padding: 0.75em 0.5em;
                    font-weight: 500;
                    border-radius: 8px;
                    color: #334155;
                }
                .react-calendar__tile:hover {
                    background-color: #f1f5f9;
                }
                .react-calendar__tile--active {
                    background: #f1f5f9 !important;
                    color: #0f172a;
                    font-weight: 700;
                }
                .react-calendar__tile--now {
                    background: #fffbeb;
                    color: #b45309;
                }
                
                /* Indicator Dots */
                .attendance-excellent abbr,
                .attendance-average abbr,
                .attendance-poor abbr {
                    position: relative;
                }
                .attendance-excellent abbr::after,
                .attendance-average abbr::after,
                .attendance-poor abbr::after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .attendance-excellent abbr::after { background-color: #10b981; } /* Emerald */
                .attendance-average abbr::after { background-color: #f59e0b; } /* Amber */
                .attendance-poor abbr::after { background-color: #ef4444; } /* Red */
            `}</style>

            <div className="w-full max-w-sm">
                <Calendar
                    onClickDay={(val) => {
                        handleDateClick(val);
                    }}
                    onChange={(val) => {
                        if (val instanceof Date) {
                            onChange(val);
                        }
                    }}
                    value={value}
                    tileClassName={tileClassName}
                    className="w-full text-sm hover:cursor-pointer"
                />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-100 w-full text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> &gt;80%</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> 50-80%</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> &lt;50%</div>
            </div>

            {/* Modal for Detailed View */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">

                        {/* Modal Header */}
                        <div className="bg-slate-50 p-5 flex items-start justify-between border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-600">
                                        <Users className="w-3.5 h-3.5 text-nutoSlate" />
                                        {totalCount} Checked
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        percentage >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                            'bg-red-50 text-red-700 border border-red-100'
                                        }`}>
                                        <UserCheck className="w-3.5 h-3.5" />
                                        {percentage}% Present
                                    </span>
                                </div>
                            </div>
                            <button
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                                onClick={() => setIsModalOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable Student List) */}
                        <div className="p-2 overflow-y-auto flex-1 bg-slate-50/50">
                            <div className="flex flex-col gap-1.5">
                                {selectedRecords.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Initial Avatar */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${record.present ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"
                                                }`}>
                                                {record.student.name[0]}{record.student.surname[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <Link
                                                    href={`/list/students/${record.student.username}`}
                                                    className="font-semibold text-sm text-slate-800 hover:text-nutoOrange transition-colors"
                                                >
                                                    {record.student.name} {record.student.surname}
                                                </Link>
                                                <span className="text-[10px] text-slate-400">ID: {record.student.username}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            {record.present ? (
                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                                                    Present
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-100">
                                                    Absent
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonAttendanceCalendar;
