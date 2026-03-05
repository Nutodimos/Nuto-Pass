"use client";

import { useState } from "react";
import AssignmentGradeForm from "@/components/forms/AssignmentGradeForm";
import Image from "next/image";
import { createPortal } from "react-dom";

export default function AssignmentGradeModal({ submission }: { submission: any }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-[10px] uppercase font-bold cursor-pointer transition-colors bg-amber-50/50 hover:bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm"
            >
                {submission.grade !== null ? "Edit Grade" : "Grade Now"}
            </button>

            {open && typeof document !== "undefined" && createPortal(
                <div className="w-screen h-screen fixed left-0 top-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 pb-8 overflow-y-auto animate-fade-in">
                    <div
                        className="bg-white p-6 rounded-3xl relative w-[90%] md:w-[60%] lg:w-[40%] xl:w-[30%] shadow-2xl animate-scale-in my-auto border border-slate-100"
                        style={{ animation: "scale-in 0.3s ease-out" }}
                    >
                        <AssignmentGradeForm
                            submissionId={submission.id}
                            currentGrade={submission.grade}
                            currentFeedback={submission.feedback}
                            setOpen={setOpen}
                        />
                        <div
                            className="absolute top-4 right-4 cursor-pointer p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                            onClick={() => setOpen(false)}
                        >
                            <Image src="/close.png" alt="Close" width={14} height={14} className="opacity-50" />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
