"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createLesson, updateLesson } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UploadCloud, CheckCircle2, AlertCircle, FileText } from "lucide-react";

type SubjectWithTeachers = {
    id: number;
    name: string;
    teachers: { id: string; name: string; surname: string }[];
};

const LessonForm = ({
    type,
    data,
    setOpen,
    relatedData,
}: {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
}) => {
    const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");

    // --- CSV Upload State ---
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<LessonSchema>({
        resolver: zodResolver(lessonSchema),
        defaultValues: data,
    });

    const [state, formAction] = useFormState(
        type === "create" ? createLesson : updateLesson,
        {
            success: false,
            error: false,
        }
    );

    const onSubmit = handleSubmit((formData) => {
        const dateBase = new Date().toISOString().split('T')[0];

        const formatDateTime = (timeInput: any) => {
            if (typeof timeInput === 'string' && timeInput.includes(':')) {
                return new Date(`${dateBase}T${timeInput}:00`);
            }
            return timeInput;
        };

        const finalData = {
            ...formData,
            startTime: formatDateTime(formData.startTime),
            endTime: formatDateTime(formData.endTime),
        };

        formAction(finalData);
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success(`Lesson ${type === "create" ? "created" : "updated"} successfully!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error("Something went wrong!");
        }
    }, [state, router, setOpen, type]);

    // --- CSV Upload Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith(".csv")) {
                toast.error("Please select a .csv file");
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    const handleCsvUpload = async () => {
        if (!file) {
            toast.error("Please select a file first");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/csv/import-timetable", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Upload failed");
                if (data.details) {
                    console.error("Upload details:", data.details);
                }
                setUploading(false);
                return;
            }

            setResults(data);
            if (data.created > 0) {
                toast.success(`Successfully uploaded ${data.created} lessons!`);
                router.refresh();
            } else {
                toast.warning("No lessons were created. Check errors.");
            }
        } catch (error) {
            console.error("CSV Upload Error:", error);
            toast.error("An unexpected error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const content = "Course,Class,Day,Start Time,End Time\nMathematics,JSS 1A,MONDAY,08:00,08:45\nEnglish,JSS 1A,MONDAY,08:45,09:30\nBiology,SSS 1B,TUESDAY,10:00,11:30";
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", "timetable_template.csv");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const { subjects, classes } = relatedData;

    // Watch the selected subject and auto-set the lecturer
    const selectedSubjectId = watch("subjectId");

    useEffect(() => {
        if (selectedSubjectId && subjects) {
            const subject = subjects.find(
                (s: SubjectWithTeachers) => s.id === Number(selectedSubjectId)
            );
            if (subject && subject.teachers.length > 0) {
                setValue("teacherId", subject.teachers[0].id);
            }
        }
    }, [selectedSubjectId, subjects, setValue]);

    // Get the currently resolved lecturer name for display
    const resolvedTeacher = (() => {
        if (!selectedSubjectId || !subjects) return null;
        const subject = subjects.find(
            (s: SubjectWithTeachers) => s.id === Number(selectedSubjectId)
        );
        if (subject && subject.teachers.length > 0) {
            const t = subject.teachers[0];
            return `${t.name} ${t.surname}`;
        }
        return null;
    })();

    // Helper to get default time string if data exists
    const getDefaultTime = (date?: Date | string) => {
        if (!date) return "";
        const d = new Date(date);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
                    <span className="text-white font-bold">L</span>
                </div>
                <h1 className="text-xl font-bold text-CPENavyDark">
                    {type === "create" ? "Create New Lesson" : "Update Lesson"}
                </h1>
            </div>

            {type === "create" && (
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-2">
                    <button
                        type="button"
                        onClick={() => { setActiveTab("manual"); setResults(null); }}
                        className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "manual"
                            ? "bg-white text-CPENavy shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Manual Entry
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("csv")}
                        className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "csv"
                            ? "bg-white text-CPENavy shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        CSV Upload
                    </button>
                </div>
            )}

            {activeTab === "manual" && (
                <form className="flex flex-col gap-6" onSubmit={onSubmit}>


                    <div className="flex justify-between flex-wrap gap-4">

                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">Day</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                                {...register("day")}
                                defaultValue={data?.day || ""}
                            >
                                <option value="" disabled>Select Day</option>
                                {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                            {errors.day?.message && (
                                <p className="text-xs text-red-400">{errors.day.message.toString()}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">Start Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                                {...register("startTime")}
                                defaultValue={getDefaultTime(data?.startTime)}
                            />
                            {errors.startTime?.message && (
                                <p className="text-xs text-red-400">{errors.startTime.message.toString()}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">End Time</label>
                            <input
                                type="time"
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                                {...register("endTime")}
                                defaultValue={getDefaultTime(data?.endTime)}
                            />
                            {errors.endTime?.message && (
                                <p className="text-xs text-red-400">{errors.endTime.message.toString()}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">Course</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                                {...register("subjectId")}
                                defaultValue={data?.subjectId || ""}
                            >
                                <option value="" disabled>Select Course</option>
                                {subjects?.map((item: SubjectWithTeachers) => (
                                    <option value={item.id} key={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {errors.subjectId?.message && (
                                <p className="text-xs text-red-400">
                                    {errors.subjectId.message.toString()}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">Class</label>
                            <select
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                                {...register("classId")}
                                defaultValue={data?.classId || ""}
                            >
                                <option value="" disabled>Select Class</option>
                                {classes?.map((item: { id: number; name: string }) => (
                                    <option value={item.id} key={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {errors.classId?.message && (
                                <p className="text-xs text-red-400">
                                    {errors.classId.message.toString()}
                                </p>
                            )}
                        </div>

                        {/* Lecturer — auto-selected from the chosen subject */}
                        <div className="flex flex-col gap-2 w-full md:w-1/4">
                            <label className="text-sm font-medium text-CPENavyDark">Lecturer</label>
                            <input type="hidden" {...register("teacherId")} />
                            <div className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-100 text-sm text-gray-600 cursor-not-allowed">
                                {resolvedTeacher || (
                                    <span className="text-gray-400 italic">Select a subject first</span>
                                )}
                            </div>
                            {errors.teacherId?.message && (
                                <p className="text-xs text-red-400">
                                    {errors.teacherId.message.toString()}
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Hidden input ID for update */}
                    {data && (
                        <input type="hidden" {...register("id")} value={data.id} />
                    )}

                    <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                        {type === "create" ? "Create" : "Update"}
                    </button>
                </form>
            )}

            {activeTab === "csv" && type === "create" && (
                <div className="flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                    {!results ? (
                        <>
                            <div className="flex justify-end mb-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="text-sm text-CPENavy hover:text-CPENavyDark font-medium flex items-center gap-1 bg-CPENavy/5 px-4 py-2 rounded-lg transition-colors border border-CPENavy/10"
                                >
                                    <FileText className="w-4 h-4" />
                                    Download sample timetable template
                                </button>
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    disabled={uploading}
                                />
                                <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all duration-300 ${file ? "border-CPENavy bg-CPENavy/5" : "border-gray-200 bg-gray-50 group-hover:bg-gray-100 group-hover:border-CPENavy/50"}`}>
                                    <UploadCloud className={`w-12 h-12 mb-4 transition-colors duration-300 ${file ? "text-CPENavy" : "text-gray-400 group-hover:text-CPENavy/50"}`} />

                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <p className="text-CPENavy font-medium text-lg text-center break-all">{file.name}</p>
                                            <p className="text-gray-500 text-sm mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            <p className="text-blue-500 text-sm mt-4 font-medium">Click or drag to change file</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-700 font-medium text-lg">Drop your timetable CSV here, or click to select</p>
                                            <p className="text-gray-400 text-sm mt-2 font-medium">Only .csv files are supported</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCsvUpload}
                                disabled={!file || uploading}
                                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm
                                    ${file && !uploading
                                        ? "bg-gradient-to-r from-CPENavy to-CPENavyDark text-white hover:shadow-lg hover:scale-[1.02]"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"}`}
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing Timetable...
                                    </span>
                                ) : (
                                    "Upload Timetable"
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
                            {/* Results Summary */}
                            <div className="bg-green-50/50 border border-green-200 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    <h3 className="text-green-800 font-bold text-lg">Upload Complete</h3>
                                </div>
                                <p className="text-green-700 ml-9 font-medium">
                                    Successfully processed and created <span className="font-bold text-green-800 text-lg">{results.created}</span> lessons.
                                </p>
                            </div>

                            {/* Errors / Skipped section */}
                            {(results.errors?.length > 0 || results.skipped?.length > 0) && (
                                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 flex flex-col gap-4 max-h-[400px]">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                        <h3 className="text-red-800 font-bold text-lg">Issues Found</h3>
                                    </div>

                                    <div className="overflow-y-auto pr-2 rounded-xl bg-white/50 border border-red-100 p-4">
                                        {results.errors?.map((err: string, i: number) => (
                                            <div key={`err-${i}`} className="text-sm text-red-600 mb-2.5 last:mb-0 flex items-start gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                                <span className="text-red-400 mt-0.5 mt-0 text-lg">•</span>
                                                <span className="font-medium">{err}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setResults(null);
                                    setFile(null);
                                }}
                                className="w-full py-3.5 px-6 rounded-xl border-2 border-CPENavy text-CPENavy font-bold text-sm hover:bg-CPENavy hover:text-white transition-all duration-300"
                            >
                                Upload Another Form
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LessonForm;
