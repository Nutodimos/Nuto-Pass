"use client";

import { updateSchoolConfig } from "@/lib/actions";
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Calendar, BookOpen, Settings } from "lucide-react";

interface SettingsFormProps {
    currentSession: string;
    currentSemester: string;
}

const SettingsForm = ({ currentSession, currentSemester }: SettingsFormProps) => {
    const [state, formAction] = useFormState(updateSchoolConfig, {
        success: false,
        error: false,
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success("Settings updated successfully!");
            router.refresh();
        } else if (state.error) {
            toast.error((state as any).messages ? (state as any).messages.join("\n") : "Something went wrong!");
        }
    }, [state, router]);

    return (
        <form action={formAction} className="space-y-6">
            {/* Session Year Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-CPENavy/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-CPENavy" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Academic Session</h3>
                        <p className="text-xs text-gray-500">Set the current school year</p>
                    </div>
                </div>
                <input
                    type="text"
                    name="sessionYear"
                    defaultValue={currentSession}
                    placeholder="e.g. 2024/25"
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-CPENavy focus:border-transparent transition-all"
                />
            </div>

            {/* Semester Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Current Semester</h3>
                        <p className="text-xs text-gray-500">Determines which courses are active</p>
                    </div>
                </div>
                <select
                    name="currentSemester"
                    defaultValue={currentSemester}
                    className="w-full p-3 border border-amber-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all cursor-pointer"
                >
                    <option value="1">Harmattan Semester</option>
                    <option value="2">Rain Semester</option>
                </select>
                <p className="text-xs text-amber-600 mt-2">
                    Courses assigned to this semester will be shown in the courses list.
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-CPENavy to-CPENavyDark text-white p-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
                <Settings className="w-4 h-4" />
                Update Settings
            </button>
        </form>
    );
};

export default SettingsForm;
