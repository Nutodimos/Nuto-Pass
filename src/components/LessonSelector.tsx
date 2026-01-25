"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ChevronDown,
    Clock,
    User,
    CheckCircle,
    Calendar,
    Zap,
} from "lucide-react";

interface Lesson {
    id: number;
    name: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    teacher: { name: string; surname: string };
}

interface LessonSelectorProps {
    lessons: Lesson[];
    selectedLesson: Lesson | null;
    onSelectLesson: (lesson: Lesson) => void;
}

const dayColors: Record<string, string> = {
    MONDAY: "from-blue-500 to-blue-600",
    TUESDAY: "from-purple-500 to-purple-600",
    WEDNESDAY: "from-green-500 to-green-600",
    THURSDAY: "from-orange-500 to-orange-600",
    FRIDAY: "from-pink-500 to-pink-600",
};

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const LessonSelector = ({
    lessons,
    selectedLesson,
    onSelectLesson,
}: LessonSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [todayLessons, setTodayLessons] = useState<Lesson[]>([]);

    // Auto-detect current/next lesson
    useEffect(() => {
        const now = new Date();
        const currentDay = dayNames[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Filter today's lessons
        const todaysLessons = lessons.filter(l => l.day === currentDay);
        setTodayLessons(todaysLessons);

        // Find current active lesson
        const activeLesson = todaysLessons.find(lesson => {
            const startDate = new Date(lesson.startTime);
            const endDate = new Date(lesson.endTime);
            const startMins = startDate.getHours() * 60 + startDate.getMinutes();
            const endMins = endDate.getHours() * 60 + endDate.getMinutes();
            return currentTime >= startMins && currentTime <= endMins;
        });

        if (activeLesson) {
            setCurrentLesson(activeLesson);
            // Auto-select if nothing is selected yet
            if (!selectedLesson) {
                onSelectLesson(activeLesson);
            }
        } else {
            // Find the next upcoming lesson
            const upcomingLesson = todaysLessons.find(lesson => {
                const startDate = new Date(lesson.startTime);
                const startMins = startDate.getHours() * 60 + startDate.getMinutes();
                return startMins > currentTime;
            });
            if (upcomingLesson) {
                setCurrentLesson(upcomingLesson);
            }
        }
    }, [lessons, selectedLesson, onSelectLesson]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const isCurrentlyActive = (lesson: Lesson) => {
        const now = new Date();
        const currentDay = dayNames[now.getDay()];
        if (lesson.day !== currentDay) return false;

        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startDate = new Date(lesson.startTime);
        const endDate = new Date(lesson.endTime);
        const startMins = startDate.getHours() * 60 + startDate.getMinutes();
        const endMins = endDate.getHours() * 60 + endDate.getMinutes();
        return currentTime >= startMins && currentTime <= endMins;
    };

    // Sort lessons: today first, then by time
    const sortedLessons = [...lessons].sort((a, b) => {
        const now = new Date();
        const currentDay = dayNames[now.getDay()];

        // Today's lessons first
        const aIsToday = a.day === currentDay;
        const bIsToday = b.day === currentDay;
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;

        // Then by day order
        const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
        const aDayIndex = dayOrder.indexOf(a.day);
        const bDayIndex = dayOrder.indexOf(b.day);
        if (aDayIndex !== bDayIndex) return aDayIndex - bDayIndex;

        // Then by time
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return (
        <div className="relative">
            {/* Today's Quick Select (if there are lessons today) */}
            {todayLessons.length > 0 && !selectedLesson && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
                >
                    <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-2">
                        <Zap className="w-4 h-4" />
                        <span>Today's Lessons ({todayLessons.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {todayLessons.map(lesson => (
                            <button
                                key={lesson.id}
                                onClick={() => onSelectLesson(lesson)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isCurrentlyActive(lesson)
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                                    }`}
                            >
                                {lesson.subject.name}
                                {isCurrentlyActive(lesson) && (
                                    <span className="ml-2 text-xs">• NOW</span>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Selected Lesson Display / Dropdown Trigger */}
            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${selectedLesson
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${selectedLesson
                            ? dayColors[selectedLesson.day] || "from-slate-500 to-slate-600"
                            : "from-slate-400 to-slate-500"
                            }`}
                    >
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        {selectedLesson ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-800">
                                        {selectedLesson.subject.name}
                                    </h3>
                                    {isCurrentlyActive(selectedLesson) && (
                                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
                                            NOW
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {selectedLesson.day} • {formatTime(selectedLesson.startTime)} -{" "}
                                    {formatTime(selectedLesson.endTime)}
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="font-semibold text-slate-600">
                                    Select a Lesson
                                </h3>
                                <p className="text-sm text-slate-400">
                                    Choose the lesson to take attendance
                                </p>
                            </>
                        )}
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                        <div className="max-h-80 overflow-y-auto">
                            {sortedLessons.length === 0 ? (
                                <div className="p-6 text-center text-slate-500">
                                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p>No lessons found for this class</p>
                                </div>
                            ) : (
                                sortedLessons.map((lesson, index) => (
                                    <motion.button
                                        key={lesson.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => {
                                            onSelectLesson(lesson);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full p-4 flex items-center gap-4 transition-all duration-200 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 ${selectedLesson?.id === lesson.id
                                                ? "bg-emerald-50"
                                                : isCurrentlyActive(lesson)
                                                    ? "bg-amber-50"
                                                    : ""
                                            }`}
                                    >
                                        {/* Day Badge */}
                                        <div
                                            className={`p-2 rounded-lg bg-gradient-to-br ${dayColors[lesson.day] || "from-slate-500 to-slate-600"
                                                }`}
                                        >
                                            <BookOpen className="w-4 h-4 text-white" />
                                        </div>

                                        {/* Lesson Info */}
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-800">
                                                    {lesson.subject.name}
                                                </h4>
                                                {isCurrentlyActive(lesson) && (
                                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
                                                        NOW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {lesson.day}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(lesson.startTime)} -{" "}
                                                    {formatTime(lesson.endTime)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {lesson.teacher.name} {lesson.teacher.surname}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Selected Indicator */}
                                        {selectedLesson?.id === lesson.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="text-emerald-500"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LessonSelector;
