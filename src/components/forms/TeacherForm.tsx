"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { AlertCircle } from "lucide-react";

const TeacherForm = ({
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
    control,
    formState: { errors },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [img, setImg] = useState<any>();

  const [state, formAction] = useFormState(
    type === "create" ? createTeacher : updateTeacher,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    formAction({ ...data, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Lecturer has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error((state as any).messages ? (state as any).messages.join("\n") : "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const { subjects, classes } = relatedData;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nutoSlate to-nutoSlateDark flex items-center justify-center">
          <span className="text-white font-bold">L</span>
        </div>
        <h1 className="text-xl font-bold text-nutoSlateDark">
          {type === "create" ? "Create New Lecturer" : "Update Lecturer"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-nutoSlate"></div>
        <span className="text-sm font-semibold text-nutoSlate">Authentication Information</span>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Matric No"
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          defaultValue={data?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-nutoOrange"></div>
        <span className="text-sm font-semibold text-nutoOrange">Personal Information</span>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Last Name"
          name="surname"
          defaultValue={data?.surname}
          register={register}
          error={errors.surname}
        />
        <InputField
          label="Phone (Optional)"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address (Optional)"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type (Optional)"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday (Optional)"
          name="birthday"
          defaultValue={data?.birthday.toISOString().split("T")[0]}
          register={register}
          error={errors.birthday}
          type="date"
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
          <label className="text-sm font-medium text-nutoSlateDark">Sex (Optional)</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-nutoSlate focus:bg-white focus:outline-none transition-all duration-200"
            {...register("sex")}
            defaultValue={data?.sex || ""}
          >
            <option value="">Not specified</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>


        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-sm font-medium text-nutoSlateDark">Courses (Optional)</label>
          <Controller
            name="subjects"
            control={control}
            defaultValue={data?.subjects || []}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                options={subjects.map((subject: { id: number; name: string }) => ({
                  value: subject.id.toString(),
                  label: subject.name,
                }))}
                className="text-sm text-gray-800"
                classNamePrefix="react-select"
                onChange={(selectedOptions) => {
                  field.onChange(selectedOptions ? selectedOptions.map((opt) => opt.value) : []);
                }}
                value={
                  field.value
                    ? subjects
                      .filter((s: any) => field.value.includes(s.id.toString()))
                      .map((s: any) => ({ value: s.id.toString(), label: s.name }))
                    : []
                }
              />
            )}
          />
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message.toString()}
            </p>
          )}
        </div>
        {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "school"}
            onSuccess={(result, { widget }) => {
              setImg(result.info);
              widget.close();
            }}
          >
            {({ open }) => {
              return (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-nutoSlate hover:bg-nutoSlate/5 transition-all cursor-pointer"
                  onClick={() => open()}
                >
                  <div className="w-10 h-10 rounded-lg bg-nutoSlate/10 flex items-center justify-center">
                    <Image src="/upload.png" alt="" width={20} height={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Upload a photo</p>
                    <p className="text-xs text-gray-400">Click to browse files</p>
                  </div>
                </div>
              );
            }}
          </CldUploadWidget>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed" title="Missing Cloudinary Key">
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
              <Image src="/upload.png" alt="" width={20} height={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Upload a photo</p>
              <p className="text-xs text-gray-400">Upload disabled</p>
            </div>
          </div>
        )}
      </div>
      {state.error && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 font-semibold text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Please fix the following errors:</span>
          </div>
          <ul className="list-disc list-inside ml-7 text-sm text-red-600 space-y-1">
            {(state as any).messages ? (
              (state as any).messages.map((msg: string, i: number) => (
                <li key={i}>{msg}</li>
              ))
            ) : (
              <li>Something went wrong!</li>
            )}
          </ul>
        </div>
      )}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-nutoSlate to-nutoSlateDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        {type === "create" ? "Create Lecturer" : "Update Lecturer"}
      </button>
    </form >
  );
};

export default TeacherForm;
