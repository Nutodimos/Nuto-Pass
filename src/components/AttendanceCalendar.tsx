"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRouter } from "next/navigation";

type AttendanceRecord = {
    id: number;
    date: Date;
    present: boolean;
    lesson: {
        subject: {
            name: string;
        };
        startTime: Date;
        endTime: Date;
    };
};

const AttendanceCalendar = ({
    attendance,
}: {
    attendance: AttendanceRecord[];
}) => {
    const [value, onChange] = useState<Date | null>(new Date());
    const [selectedDateRecords, setSelectedDateRecords] = useState<AttendanceRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const tileClassName = ({ date, view }: { date: Date; view: string }) => {
        if (view === "month") {
            const dayRecords = attendance.filter(
                (a) => new Date(a.date).toDateString() === date.toDateString()
            );
            if (dayRecords.length > 0) {
                // If any absent, mark red. If all present, mark green.
                const hasAbsent = dayRecords.some((a) => !a.present);
                return hasAbsent ? "attendance-absent" : "attendance-present";
            }
        }
        return null;
    };

    const handleDateClick = (value: Date) => {
        const dayRecords = attendance.filter(
            (a) => new Date(a.date).toDateString() === value.toDateString()
        );
        if (dayRecords.length > 0) {
            setSelectedDateRecords(dayRecords);
            setIsModalOpen(true);
        }
    }

    return (
        <div className="h-full flex flex-col items-center">
            <style jsx global>{`
        .attendance-present abbr {
           position: relative;
        }
        .attendance-present abbr::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background-color: #22c55e;
            border-radius: 50%;
        }
        
        .attendance-absent abbr {
            position: relative;
         }
         .attendance-absent abbr::after {
             content: '';
             position: absolute;
             bottom: 2px;
             left: 50%;
             transform: translateX(-50%);
             width: 6px;
             height: 6px;
             background-color: #ef4444;
             border-radius: 50%;
         }
      `}</style>
            <Calendar
                onChange={(val) => {
                    if (val instanceof Date) {
                        onChange(val)
                        handleDateClick(val);
                    }
                }}
                value={value}
                tileClassName={tileClassName}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-md shadow-lg w-96 max-w-full relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            onClick={() => setIsModalOpen(false)}
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold mb-4">
                            Attendance Details - {value?.toLocaleDateString()}
                        </h3>
                        <div className="flex flex-col gap-3">
                            {selectedDateRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className={`p-3 rounded-md border-l-4 ${record.present
                                        ? "bg-green-50 border-green-500"
                                        : "bg-red-50 border-red-500"
                                        }`}
                                >
                                    <div className="font-medium">{record.lesson.subject.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(record.lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(record.lesson.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`text-sm font-semibold mt-1 ${record.present ? "text-green-700" : "text-red-700"}`}>
                                        {record.present ? "Present" : "Absent"}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="mt-4 w-full py-2 bg-nutoSlate text-white rounded-md hover:bg-nutoSlateDark"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
