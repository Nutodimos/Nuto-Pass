"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ChevronDown,
    Clock,
    User,
    CheckCircle,
    Calendar,
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

const LessonSelector = ({
    lessons,
    selectedLesson,
    onSelectLesson,
}: LessonSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="relative">
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
                                <h3 className="font-semibold text-slate-800">
                                    {selectedLesson.subject.name}
                                </h3>
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
                            {lessons.length === 0 ? (
                                <div className="p-6 text-center text-slate-500">
                                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p>No lessons found for this class</p>
                                </div>
                            ) : (
                                lessons.map((lesson, index) => (
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
                                            <h4 className="font-semibold text-slate-800">
                                                {lesson.subject.name}
                                            </h4>
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
