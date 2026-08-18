"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { assignmentSubmissionSchema, AssignmentSubmissionSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createAssignmentSubmission } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { LinkIcon, UploadCloud, CheckCircle2 } from "lucide-react";

const AssignmentSubmissionForm = ({
    type,
    data,
    setOpen,
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
    } = useForm<AssignmentSubmissionSchema>({
        resolver: zodResolver(assignmentSubmissionSchema),
        defaultValues: {
            assignmentId: data?.assignmentId,
            studentId: data?.studentId,
            submissionUrl: "",
        },
    });

    const submissionUrlValue = watch("submissionUrl");
    const [uploadMode, setUploadMode] = useState<"link" | "file">("file");

    const [state, formAction] = useFormState(
        createAssignmentSubmission,
        { success: false, error: false }
    );

    const onSubmit = handleSubmit((formData) => {
        formAction({ ...formData, submissionUrl: submissionUrlValue || formData.submissionUrl });
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success(`Assignment submitted successfully!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error(
                (state as any).messages
                    ? (state as any).messages.join("\n")
                    : "Failed to submit assignment. Please try again."
            );
        }
    }, [state, router, setOpen]);

    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-CPENavy/10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-inner pt-1">
                    <UploadCloud className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">
                        Submit Your Work
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Upload a file or provide a link to your assignment.</p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                <input type="hidden" {...register("assignmentId")} />
                <input type="hidden" {...register("studentId")} />

                {/* Toggle Mode */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full">
                    <button
                        type="button"
                        onClick={() => {
                            setUploadMode("file");
                            if (uploadMode === "link") setValue("submissionUrl", "");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${uploadMode === "file" ? 'bg-white text-CPENavy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UploadCloud className="w-4 h-4" /> Upload File
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setUploadMode("link");
                            if (uploadMode === "file") setValue("submissionUrl", "");
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${uploadMode === "link" ? 'bg-white text-CPENavy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LinkIcon className="w-4 h-4" /> Paste Link
                    </button>
                </div>

                {/* Input Area */}
                <div className="min-h-[120px] flex flex-col justify-center gap-2">
                    {uploadMode === "file" ? (
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-bold text-slate-700 flex justify-between">
                                Attach Document
                                {submissionUrlValue && <span className="text-emerald-500 flex items-center gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> File Ready</span>}
                            </label>

                            {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                                <CldUploadWidget
                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "school"}
                                    onSuccess={(result: any, { widget }) => {
                                        setValue("submissionUrl", result.info.secure_url, { shouldValidate: true });
                                        toast.success("File uploaded! Ready to submit.");
                                        widget.close();
                                    }}
                                >
                                    {({ open }) => (
                                        <div
                                            className={`flex flex-col items-center justify-center gap-3 w-full py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${submissionUrlValue ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-CPENavy/30'}`}
                                            onClick={() => open()}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${submissionUrlValue ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                                {submissionUrlValue ? <CheckCircle2 className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                                            </div>
                                            <div className="text-center px-4">
                                                <p className={`font-bold text-sm ${submissionUrlValue ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                    {submissionUrlValue ? "File Attached Successfully" : "Click to Browse Files"}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {submissionUrlValue ? "Click again to change the file" : "Supports Word, PDF, Images etc. (Max 10MB)"}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CldUploadWidget>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 w-full py-8 border-2 border-dashed rounded-2xl bg-gray-100 opacity-50 cursor-not-allowed" title="Missing Cloudinary Key">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200">
                                        <Image src="/upload.png" alt="" width={24} height={24} className="opacity-50" />
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-sm font-bold text-gray-500">Uploads Disabled</p>
                                        <p className="text-xs text-gray-400 mt-1">Cloudinary is not configured.</p>
                                    </div>
                                </div>
                            )}

                            <input type="hidden" {...register("submissionUrl")} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full animate-fade-in">
                            <label className="text-sm font-bold text-slate-700">External URL Link</label>
                            <input
                                type="url"
                                placeholder="https://docs.google.com/..."
                                {...register("submissionUrl")}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                            />
                            {errors.submissionUrl?.message && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.submissionUrl.message.toString()}
                                </p>
                            )}
                            <p className="text-xs text-slate-500 font-medium">Ensure the link permissions are set to &quot;Anyone with the link can view&quot;.</p>
                        </div>
                    )}

                    {/* Error specifically for no URL present on submit attempt */}
                    {errors.submissionUrl && uploadMode === "file" && !submissionUrlValue && (
                        <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-lg mt-2">
                            Please upload a file before submitting.
                        </p>
                    )}
                </div>
            </div>

            <button
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-black tracking-wide shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 mt-2"
                disabled={!submissionUrlValue}
            >
                Submit Assignment
            </button>
        </form>
    );
};

export default AssignmentSubmissionForm;
