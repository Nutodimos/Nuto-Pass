"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect } from "react";
import { lessonSchema, LessonSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createLesson, updateLesson } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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
            toast(`Lesson has been ${type === "create" ? "created" : "updated"}!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error("Something went wrong!");
        }
    }, [state, router, setOpen, type]);

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
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nutoSlate to-nutoSlateDark flex items-center justify-center">
                    <span className="text-white font-bold">L</span>
                </div>
                <h1 className="text-xl font-bold text-nutoSlateDark">
                    {type === "create" ? "Create New Lesson" : "Update Lesson"}
                </h1>
            </div>

            <div className="flex justify-between flex-wrap gap-4">

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-sm font-medium text-nutoSlateDark">Day</label>
                    <select
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
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
                    <label className="text-sm font-medium text-nutoSlateDark">Start Time</label>
                    <input
                        type="time"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
                        {...register("startTime")}
                        defaultValue={getDefaultTime(data?.startTime)}
                    />
                    {errors.startTime?.message && (
                        <p className="text-xs text-red-400">{errors.startTime.message.toString()}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-sm font-medium text-nutoSlateDark">End Time</label>
                    <input
                        type="time"
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
                        {...register("endTime")}
                        defaultValue={getDefaultTime(data?.endTime)}
                    />
                    {errors.endTime?.message && (
                        <p className="text-xs text-red-400">{errors.endTime.message.toString()}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-sm font-medium text-nutoSlateDark">Subject</label>
                    <select
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
                        {...register("subjectId")}
                        defaultValue={data?.subjectId || ""}
                    >
                        <option value="" disabled>Select Subject</option>
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
                    <label className="text-sm font-medium text-nutoSlateDark">Class</label>
                    <select
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
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
                    <label className="text-sm font-medium text-nutoSlateDark">Lecturer</label>
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

            <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-nutoSlate to-nutoSlateDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    );
};

export default LessonForm;
