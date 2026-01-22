"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { materialSchema, MaterialSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createMaterial } from "@/lib/actions"; // We only implement create for now as delete is just an action
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

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
        formState: { errors },
    } = useForm<MaterialSchema>({
        resolver: zodResolver(materialSchema),
    });

    const [filePath, setFilePath] = useState<string>("");

    // Since we only really support create for materials right now (update is complex for files), 
    // we default to create action. Ideally, updateMaterial should be implemented if update is needed.
    // For this tasks, let's assume Delete is handled separately and Create is primary.
    const [state, formAction] = useFormState(createMaterial, {
        success: false,
        error: false,
    });

    const onSubmit = handleSubmit((data) => {
        if (!filePath) {
            toast.error("Please upload a file!");
            return;
        }
        formAction({ ...data, filePath: filePath });
    });

    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            toast(`Material has been created!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error("Something went wrong!");
        }
    }, [state, router, setOpen]);

    const { classes, subjects } = relatedData;

    return (
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">
                Upload New Material
            </h1>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Title"
                    name="title"
                    register={register}
                    error={errors.title}
                />

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs text-gray-500">Level (Class)</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs text-gray-500">Course (Subject)</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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
                    <span className="text-xs text-gray-500 block mb-2">Upload File (PDF, Doc, etc.)</span>
                    {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                        <CldUploadWidget
                            uploadPreset="school"
                            onSuccess={(result, { widget }) => {
                                setFilePath(result?.info?.secure_url);
                                setValue("filePath", result?.info?.secure_url); // Update form value
                                toast.success("File uploaded successfully!");
                                widget.close();
                            }}
                        >
                            {({ open }) => {
                                return (
                                    <div
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => open()}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {filePath ? (
                                                <>
                                                    <p className="mb-2 text-sm text-green-600 font-semibold">File Uploaded!</p>
                                                    <p className="text-xs text-gray-500 overflow-hidden px-4 text-center">{filePath}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Image src="/upload.png" alt="" width={32} height={32} className="mb-2 opacity-60" />
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                                                    <p className="text-xs text-gray-500">PDF, DOC, PPT, IMG</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            }}
                        </CldUploadWidget>
                    ) : (
                        <div className="text-red-500">Cloudinary key missing!</div>
                    )}
                    {errors.filePath?.message && (
                        <p className="text-xs text-red-400 mt-1">
                            {errors.filePath.message.toString()}
                        </p>
                    )}
                </div>
            </div>

            <button className="bg-blue-400 text-white p-2 rounded-md">
                {type === "create" ? "Upload" : "Update"}
            </button>
        </form>
    );
};

export default MaterialForm;
