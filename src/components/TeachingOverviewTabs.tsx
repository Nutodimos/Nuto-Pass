"use client";

import { useState } from "react";
import { BookOpen, Calendar } from "lucide-react";

interface TeachingOverviewTabsProps {
    coursesContent: React.ReactNode;
    lessonsContent: React.ReactNode;
    coursesCount: number;
    lessonsCount: number;
}

const TeachingOverviewTabs = ({
    coursesContent,
    lessonsContent,
    coursesCount,
    lessonsCount,
}: TeachingOverviewTabsProps) => {
    const [activeTab, setActiveTab] = useState<"courses" | "lessons">("courses");

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-nutoSlateDark mb-4">
                Teaching Overview
            </h2>

            {/* Tab Buttons */}
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setActiveTab("courses")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "courses"
                            ? "bg-white text-nutoSlate shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Courses</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "courses"
                                ? "bg-nutoSlate text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                    >
                        {coursesCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("lessons")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === "lessons"
                            ? "bg-white text-nutoOrange shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Lessons</span>
                    <span
                        className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "lessons"
                                ? "bg-nutoOrange text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                    >
                        {lessonsCount}
                    </span>
                </button>
            </div>

            {/* Tab Content */}
            <div>{activeTab === "courses" ? coursesContent : lessonsContent}</div>
        </div>
    );
};

export default TeachingOverviewTabs;
