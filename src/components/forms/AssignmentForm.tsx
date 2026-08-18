"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
    assignmentSchema,
    AssignmentSchema,
} from "@/lib/formValidationSchemas";
import {
    createAssignment,
    updateAssignment,
} from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { UploadCloud, CheckCircle2, ClipboardSignature } from "lucide-react";

const AssignmentForm = ({
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
        setValue,
        watch,
        formState: { errors },
    } = useForm<AssignmentSchema>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            ...data,
            startDate: data?.startDate ? new Date(data.startDate) : undefined,
            dueDate: data?.dueDate ? new Date(data.dueDate) : undefined,
        }
    });

    const attachmentUrlValue = watch("attachmentUrl");

    const [state, formAction] = useFormState(
        type === "create" ? createAssignment : updateAssignment,
        {
            success: false,
            error: false,
        }
    );

    const onSubmit = handleSubmit((formData) => {
        formAction({ ...formData, attachmentUrl: attachmentUrlValue });
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success(`Assignment ${type === "create" ? "created" : "updated"} successfully!`);
            setTimeout(() => {
                setOpen(false);
                router.refresh();
            }, 100);
        } else if (state.error) {
            toast.error(
                (state as any).messages
                    ? (state as any).messages.join("\n")
                    : "Failed to save assignment. Please try again."
            );
        }
    }, [state, router, type, setOpen]);

    const { subjects } = relatedData || { subjects: [] };

    return (
        <form className="flex flex-col gap-6 w-full" onSubmit={onSubmit}>
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-CPENavy/10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-inner pt-1">
                    <ClipboardSignature className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">
                        {type === "create" ? "Create Assignment" : "Update Assignment"}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {type === "create" ? "Design a new task for your students." : "Modify the existing assignment details."}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <InputField
                    label="Assignment Title"
                    name="title"
                    defaultValue={data?.title}
                    register={register}
                    error={errors?.title}
                />

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-slate-700">Requirements / Instructions (Optional)</label>
                    <textarea
                        {...register("description")}
                        defaultValue={data?.description}
                        rows={4}
                        placeholder="Provide detailed instructions..."
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 resize-y"
                    />
                    {errors.description?.message && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                            {errors.description.message.toString()}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-slate-700 flex justify-between">
                        Attach Resource (Optional)
                        {attachmentUrlValue && <span className="text-emerald-500 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Attached</span>}
                    </label>

                    {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                        <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "school"}
                            onSuccess={(result: any, { widget }) => {
                                setValue("attachmentUrl", result.info.secure_url, { shouldValidate: true });
                                toast.success("File attached successfully.");
                                widget.close();
                            }}
                        >
                            {({ open }) => (
                                <div
                                    className={`flex items-center gap-4 w-full p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${attachmentUrlValue ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-blue-300'}`}
                                    onClick={() => open()}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${attachmentUrlValue ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                        {attachmentUrlValue ? <CheckCircle2 className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${attachmentUrlValue ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            {attachmentUrlValue ? "Resource Attached" : "Upload Worksheet/Instructions"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {attachmentUrlValue ? "Click to change the file" : "Browse files (Max 10MB)"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CldUploadWidget>
                    ) : (
                        <div className="flex items-center gap-4 w-full p-4 border-2 border-dashed rounded-2xl bg-gray-100 opacity-50 cursor-not-allowed" title="Missing Cloudinary Key">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                                <Image src="/upload.png" alt="" width={20} height={20} className="opacity-50" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500">Uploads Disabled</p>
                                <p className="text-xs text-gray-400 mt-1">Cloudinary is not configured.</p>
                            </div>
                        </div>
                    )}

                    <input type="hidden" {...register("attachmentUrl")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Start Date"
                        name="startDate"
                        defaultValue={data?.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : ""}
                        register={register}
                        error={errors?.startDate}
                        type="datetime-local"
                    />
                    <InputField
                        label="Due Date"
                        name="dueDate"
                        defaultValue={data?.dueDate ? new Date(data.dueDate).toISOString().slice(0, 16) : ""}
                        register={register}
                        error={errors?.dueDate}
                        type="datetime-local"
                    />
                </div>

                {data && (
                    <input type="hidden" {...register("id")} value={data.id} />
                )}

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-slate-700">Select Course</label>
                    <select
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
                        {...register("subjectId")}
                        defaultValue={data?.subjectId}
                    >
                        <option value="" disabled selected>Choose a course...</option>
                        {subjects.map((subject: { id: number; name: string }) => (
                            <option value={subject.id} key={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>
                    {errors.subjectId?.message && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                            {errors.subjectId.message.toString()}
                        </p>
                    )}
                </div>
            </div>

            <button
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black tracking-wide shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 mt-2"
            >
                {type === "create" ? "Create Assignment" : "Update Details"}
            </button>
        </form>
    );
};

export default AssignmentForm;
