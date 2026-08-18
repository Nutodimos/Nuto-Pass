"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  classSchema,
  ClassSchema,
  subjectSchema,
  SubjectSchema,
} from "@/lib/formValidationSchemas";
import {
  createClass,
  createSubject,
  updateClass,
  updateSubject,
} from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTaxonomy } from "@/hooks/use-taxonomy";

const ClassForm = ({
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
  const taxonomy = useTaxonomy();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassSchema>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      gradeId: 1, // Always use the single grade record
      supervisorId: data?.supervisorId || relatedData?.teachers?.[0]?.id,
      name: data?.name || "",
      id: data?.id,
    }
  });

  const [state, formAction] = useFormState(
    type === "create" ? createClass : updateClass,
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
      toast.success(`${taxonomy.class} ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error((state as any).messages ? (state as any).messages.join("\n") : "Something went wrong!");
    }
  }, [state, router, type, setOpen, taxonomy.class]);

  const { teachers } = relatedData;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
          <span className="text-white font-bold">{taxonomy.class.charAt(0)}</span>
        </div>
        <h1 className="text-xl font-bold text-CPENavyDark">
          {type === "create" ? `Create New ${taxonomy.class}` : `Update ${taxonomy.class}`}
        </h1>
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={`${taxonomy.class} Name`}
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
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
          <label className="text-sm font-medium text-CPENavyDark">{taxonomy.class} Adviser / Supervisor</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("supervisorId")}
            defaultValue={data?.supervisorId || relatedData?.teachers?.[0]?.id}
          >
            {teachers.map(
              (teacher: { id: string; name: string; surname: string }) => (
                <option
                  value={teacher.id}
                  key={teacher.id}
                  selected={data && teacher.id === data.supervisorId}
                >
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
            </p>
          )}
        </div>
        {/* gradeId is hardcoded to 1 — hidden input keeps schema happy */}
        <input type="hidden" {...register("gradeId")} value={data?.gradeId ?? 1} />
      </div>
      {state.error && (
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Please fix the following errors:</p>
          {(state as any).messages ? (
            (state as any).messages.map((msg: string, i: number) => (
              <p key={i} className="text-sm text-red-600">• {msg}</p>
            ))
          ) : (
            <p className="text-sm text-red-600">• Something went wrong!</p>
          )}
        </div>
      )}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        {type === "create" ? `Create ${taxonomy.class}` : `Update ${taxonomy.class}`}
      </button>
    </form>
  );
};

export default ClassForm;
