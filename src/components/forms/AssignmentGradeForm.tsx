"use client";

import { useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { useFormState } from "react-dom";
import { gradeAssignmentSubmission } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const AssignmentGradeForm = ({
    submissionId,
    currentGrade,
    currentFeedback,
    setOpen,
}: {
    submissionId: number;
    currentGrade?: number | null;
    currentFeedback?: string | null;
    setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
    const [grade, setGrade] = useState<number | "">(currentGrade || "");
    const [feedback, setFeedback] = useState(currentFeedback || "");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (grade === "" || grade < 0 || grade > 100) {
            toast.error("Please enter a valid grade between 0 and 100.");
            return;
        }

        setIsLoading(true);

        const result = await gradeAssignmentSubmission(submissionId, Number(grade), feedback);

        if (result.success) {
            toast.success("Grade saved successfully!");
            setOpen(false);
            router.refresh();
        } else {
            toast.error("Failed to save grade. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        Grade Submission
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Assign a score and provide feedback.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-slate-700">Grade (0-100)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none transition-all duration-200 text-xl font-bold"
                        placeholder="e.g. 85"
                        required
                    />
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-slate-700">Feedback (Optional)</label>
                    <textarea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Great job on..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none transition-all duration-200 resize-none"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? "Saving..." : "Save Grade"}
            </button>
        </form>
    );
};

export default AssignmentGradeForm;
