"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";

const schema = z.object({
    id: z.coerce.number().optional(),
    title: z.string().min(1, { message: "Title is required!" }),
    description: z.string().min(1, { message: "Description is required!" }),
    date: z.coerce.date({ message: "Date is required!" }),
    targetAudience: z.enum(["all", "students", "teachers"], {
        message: "Target audience is required!",
    }),
    classId: z.coerce.number().optional(),
});

type Inputs = z.infer<typeof schema>;

const AnnouncementForm = ({
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
        formState: { errors },
    } = useForm<Inputs>({
        resolver: zodResolver(schema),
        defaultValues: data
            ? {
                ...data,
                date: data.date ? new Date(data.date).toISOString().split("T")[0] : undefined,
            }
            : undefined,
    });

    const [state, formAction] = useFormState(
        type === "create" ? createAnnouncement : updateAnnouncement,
        {
            success: false,
            error: false,
        }
    );

    const router = useRouter();

    const onSubmit = handleSubmit((formData) => {
        formAction(formData);
    });

    useEffect(() => {
        if (state.success) {
            toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
            setOpen(false);
            router.refresh();
        } else if (state.error) {
            toast.error(
                (state as any).messages
                    ? (state as any).messages[0]
                    : "An error occurred!"
            );
        }
    }, [state, router, type, setOpen]);

    const { classes } = relatedData || {};

    return (
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold text-slate-800">
                {type === "create" ? "Create a new announcement" : "Update announcement"}
            </h1>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Title"
                    name="title"
                    defaultValue={data?.title}
                    register={register}
                    error={errors?.title}
                    className="md:w-full"
                />
            </div>

            <div className="flex flex-col gap-2 w-full">
                <label className="text-xs text-gray-500">Description</label>
                <textarea
                    rows={5}
                    {...register("description")}
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    defaultValue={data?.description}
                />
                {errors.description?.message && (
                    <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
                )}
            </div>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Date"
                    name="date"
                    type="date"
                    defaultValue={
                        data?.date
                            ? new Date(data.date).toISOString().split("T")[0]
                            : undefined
                    }
                    register={register}
                    error={errors?.date}
                    className="md:w-[48%]"
                />

                <div className="flex flex-col gap-2 w-full md:w-[48%]">
                    <label className="text-xs text-gray-500">Target Audience</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("targetAudience")}
                        defaultValue={data?.targetAudience || "all"}
                    >
                        <option value="all">All Users</option>
                        <option value="students">Students Only</option>
                        <option value="teachers">Teachers Only</option>
                    </select>
                    {errors.targetAudience?.message && (
                        <p className="text-xs text-red-400">
                            {errors.targetAudience.message.toString()}
                        </p>
                    )}
                </div>
            </div>

            {classes && (
                <div className="flex flex-col gap-2 w-full">
                    <label className="text-xs text-gray-500">
                        Class (Optional - leave empty for all classes)
                    </label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("classId")}
                        defaultValue={data?.classId}
                    >
                        <option value="">All Classes</option>
                        {classes.map((classItem: { id: number; name: string }) => (
                            <option value={classItem.id} key={classItem.id}>
                                {classItem.name}
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

            {data && (
                <InputField
                    label="Id"
                    name="id"
                    defaultValue={data?.id}
                    register={register}
                    error={errors?.id}
                    hidden
                />
            )}

            {state.error && (
                <span className="text-red-500">
                    {(state as any).messages ? (state as any).messages.join(", ") : "Something went wrong!"}
                </span>
            )}

            <button className="bg-nutoSlate text-white p-2 rounded-md hover:bg-nutoSlateDark transition-colors">
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    );
};

export default AnnouncementForm;
