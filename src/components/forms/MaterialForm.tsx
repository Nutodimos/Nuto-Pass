"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { materialSchema, MaterialSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createMaterial } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import LocalUploadWidget from "../LocalUploadWidget";

const MaterialForm = ({
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
    } = useForm<MaterialSchema>({
        resolver: zodResolver(materialSchema),
        defaultValues: {
            isGeneral: false,
        },
    });

    const [filePath, setFilePath] = useState<string>("");
    const isGeneral = watch("isGeneral");

    const [state, formAction] = useFormState(createMaterial, {
        success: false,
        error: false,
    });

    const onSubmit = handleSubmit((data) => {
        if (!filePath) {
            toast.error("Please upload a file!");
            return;
        }
        // If isGeneral, classId is not required. Also, teachers don't need to select a class anymore.
        if (relatedData.role === "admin" && !data.isGeneral && !data.classId) {
            toast.error("Please select a class or mark as general document!");
            return;
        }
        formAction({ ...data, filePath: filePath });
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast.success(`Material uploaded successfully!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error(
                (state as any).messages
                    ? (state as any).messages.join("\n")
                    : "Failed to upload material. Please try again."
            );
        }
    }, [state, router, setOpen]);

    const { classes, subjects, role } = relatedData;

    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPEGold to-CPEGoldDark flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                </div>
                <h1 className="text-xl font-bold text-CPENavyDark">
                    Upload New Material
                </h1>
            </div>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Title"
                    name="title"
                    register={register}
                    error={errors.title}
                />

                {/* Admin-only: General Document Checkbox */}
                {role === "admin" && (
                    <div className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                        <input
                            type="checkbox"
                            id="isGeneral"
                            {...register("isGeneral")}
                            className="w-5 h-5 rounded border-2 border-amber-300 text-CPEGold focus:ring-CPEGold cursor-pointer"
                        />
                        <label htmlFor="isGeneral" className="flex-1 cursor-pointer">
                            <span className="font-semibold text-amber-800">📚 General Document</span>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Available to all students and teachers (e.g., Student Handbook, School Policies)
                            </p>
                        </label>
                    </div>
                )}

                {/* Admin-Only: Class selection if not a general document */}
                {role === "admin" && !isGeneral && (
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-sm font-medium text-CPENavyDark">Level</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
                            {...register("classId")}
                        >
                            <option value="">Select Level</option>
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
                )}

                <div className={`flex flex-col gap-2 w-full ${role === "admin" && !isGeneral ? 'md:w-1/4' : 'md:w-1/2'}`}>
                    <label className="text-sm font-medium text-CPENavyDark">Course</label>
                    <select
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 hover:bg-white focus:border-CPENavy focus:bg-white focus:ring-4 focus:ring-CPENavy/10 focus:outline-none transition-all duration-200"
                        {...register("subjectId")}
                    >
                        <option value="">Select Course</option>
                        {subjects?.map((item: { id: number; name: string }) => (
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

                <div className="w-full">
                    <span className="text-sm font-medium text-CPENavyDark block mb-2">Upload File</span>
                    <LocalUploadWidget
                        category="materials"
                        onSuccess={(result, { widget }) => {
                            setFilePath(result?.info?.secure_url);
                            setValue("filePath", result?.info?.secure_url);
                            widget.close();
                        }}
                    >
                        {({ open }) => {
                            return (
                                <div
                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-CPEGold/5 hover:border-CPEGold hover:shadow-lg transition-all duration-300 group"
                                    onClick={() => open()}
                                >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {filePath ? (
                                            <>
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 shadow-md flex items-center justify-center mb-3">
                                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <p className="mb-1 text-sm text-slate-800 font-bold overflow-hidden px-6 text-center line-clamp-1">{filePath.split('/').pop()}</p>
                                                <p className="text-xs text-CPEGold font-semibold group-hover:underline">Click to change file</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-CPENavy to-CPENavyDark shadow-lg flex items-center justify-center mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                                                    <Image src="/upload.png" alt="" width={28} height={28} className="brightness-0 invert" />
                                                </div>
                                                <p className="text-base font-bold text-CPENavyDark mb-1">Upload Material Document</p>
                                                <p className="text-xs font-semibold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">PDF, DOC, PPT, IMG (Max 10MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        }}
                    </LocalUploadWidget>
                    {errors.filePath?.message && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.filePath.message.toString()}
                        </p>
                    )}
                </div>
            </div>

            <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
                {isGeneral ? "Upload General Document" : "Upload Material"}
            </button>
        </form>
    );
};

export default MaterialForm;
