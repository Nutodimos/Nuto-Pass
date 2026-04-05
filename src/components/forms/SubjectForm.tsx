"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { createSubject, updateSubject } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const SubjectForm = ({
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
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
  });

  // AFTER REACT 19 IT'LL BE USEACTIONSTATE

  const [state, formAction] = useFormState(
    type === "create" ? createSubject : updateSubject,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {

    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Course ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(`Something went wrong!`);
    }
  }, [state, router, type, setOpen]);

  const { teachers } = relatedData;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPEGold to-CPEGoldDark flex items-center justify-center">
          <span className="text-white font-bold">C</span>
        </div>
        <h1 className="text-xl font-bold text-CPENavyDark">
          {type === "create" ? "Create New Course" : "Update Course"}
        </h1>
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Course Code"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
          placeholder="e.g. CPE 501"
        />
        <InputField
          label="Course Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
          placeholder="e.g. Introduction to Computing"
        />
        <InputField
          label="Credits"
          name="credits"
          type="number"
          defaultValue={data?.credits}
          register={register}
          error={errors?.credits}
          placeholder="e.g. 3"
        />
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-sm font-medium text-CPENavyDark">Lecturers</label>
          <select
            multiple
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200 min-h-[100px]"
            {...register("teachers")}
            defaultValue={data?.teachers?.map((t: { id: string }) => t.id) || []}
          >
            {teachers.map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">
              {errors.teachers.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-sm font-medium text-CPENavyDark">Semester</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("semester")}
            defaultValue={data?.semester ?? "1"}
          >
            <option value="1">Harmattan Semester</option>
            <option value="2">Rain Semester</option>
          </select>
          {errors.semester?.message && (
            <p className="text-xs text-red-400">
              {errors.semester.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-[22%]">
          <label className="text-sm font-medium text-CPENavyDark">Level</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("level")}
            defaultValue={data?.level ?? ""}
          >
            <option value="">Any Level</option>
            <option value="100">100 Level</option>
            <option value="200">200 Level</option>
            <option value="300">300 Level</option>
            <option value="400">400 Level</option>
            <option value="500">500 Level</option>
            <option value="600">600 Level (PG)</option>
          </select>
          {errors.level?.message && (
            <p className="text-xs text-red-400">
              {errors.level.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">Something went wrong!</span>
      )}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPEGold to-CPEGoldDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        {type === "create" ? "Create Course" : "Update Course"}
      </button>
    </form>
  );
};

export default SubjectForm;
