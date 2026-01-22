"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Shield, Sparkles } from "lucide-react";
import LessonSelector from "./LessonSelector";
import AttendanceSessionControl from "./AttendanceSessionControl";

interface Lesson {
    id: number;
    name: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: { name: string };
    teacher: { name: string; surname: string };
}

interface AttendancePanelProps {
    lessons: Lesson[];
    className: string;
}

const AttendancePanel = ({ lessons, className }: AttendancePanelProps) => {
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-8">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30"
                        >
                            <Fingerprint className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Biometric Attendance
                                <Sparkles className="w-5 h-5 text-yellow-400" />
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {className} • Real-time fingerprint tracking
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/80">Secure Mode</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Step 1: Select Lesson */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                            1
                        </div>
                        <h2 className="font-semibold text-slate-700">Select Lesson</h2>
                    </div>
                    <LessonSelector
                        lessons={lessons}
                        selectedLesson={selectedLesson}
                        onSelectLesson={setSelectedLesson}
                    />
                </div>

                {/* Step 2: Session Control */}
                <motion.div
                    initial={false}
                    animate={{
                        opacity: selectedLesson ? 1 : 0.5,
                        filter: selectedLesson ? "blur(0px)" : "blur(2px)"
                    }}
                    className={selectedLesson ? "" : "pointer-events-none"}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${selectedLesson
                                ? "bg-slate-800 text-white"
                                : "bg-slate-300 text-slate-500"
                            }`}>
                            2
                        </div>
                        <h2 className={`font-semibold ${selectedLesson ? "text-slate-700" : "text-slate-400"
                            }`}>
                            Manage Session
                        </h2>
                    </div>

                    {selectedLesson ? (
                        <AttendanceSessionControl
                            lessonId={selectedLesson.id}
                            lessonName={selectedLesson.subject.name}
                            className={className}
                        />
                    ) : (
                        <div className="bg-slate-100 rounded-2xl p-8 text-center">
                            <Fingerprint className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">
                                Select a lesson above to manage attendance
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AttendancePanel;
