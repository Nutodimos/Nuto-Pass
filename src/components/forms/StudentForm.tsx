"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
  teacherSchema,
  TeacherSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createStudent,
  createTeacher,
  updateStudent,
  updateTeacher,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";

const StudentForm = ({
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
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
  });

  const [img, setImg] = useState<any>();

  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((data) => {

    formAction({ ...data, img: img?.secure_url });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`Student ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error((state as any).messages ? (state as any).messages.join("\n") : "Something went wrong!");
    }
  }, [state, router, type, setOpen]);

  const { grades, classes } = relatedData;

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <h1 className="text-xl font-bold text-CPENavyDark">
          {type === "create" ? "Create New Student" : "Update Student"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-CPENavy"></div>
        <span className="text-sm font-semibold text-CPENavy">Authentication Information</span>
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
        <div className="w-1 h-4 rounded-full bg-CPEGold"></div>
        <span className="text-sm font-semibold text-CPEGold">Personal Information</span>
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-CPENavy hover:bg-CPENavy/5 transition-all cursor-pointer"
                onClick={() => open()}
              >
                <div className="w-10 h-10 rounded-lg bg-CPENavy/10 flex items-center justify-center">
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
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        <InputField
          label="Blood Type"
          name="bloodType"
          defaultValue={data?.bloodType}
          register={register}
          error={errors.bloodType}
        />
        <InputField
          label="Birthday"
          name="birthday"
          defaultValue={data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : ""}
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
          <label className="text-sm font-medium text-CPENavyDark">Sex</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4 hidden">
          <label className="text-sm font-medium text-CPENavyDark">Grade</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("gradeId")}
            defaultValue={data?.gradeId}
          >
            {grades.map((grade: { id: number; level: number }) => (
              <option value={grade.id} key={grade.id}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-sm font-medium text-CPENavyDark">Level</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("classId")}
            defaultValue={data?.classId}
            onChange={(e) => {
              const selectedClassId = parseInt(e.target.value);
              // We need to cast classes to any because TS doesn't know about gradeId property
              const selectedClass = (classes as any[]).find((c) => c.id === selectedClassId);
              if (selectedClass) {
                setValue("gradeId", selectedClass.gradeId);
              }
            }}
          >
            {classes.map(
              (classItem: {
                id: number;
                name: string;
                capacity: number;
                _count: { students: number };
                gradeId: number;
              }) => (
                <option value={classItem.id} key={classItem.id}>
                  {classItem.name}
                </option>
              )
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
      </div>
      {state.error && (
        <span className="text-red-500">
          {(state as any).messages ? (state as any).messages.join(", ") : "Something went wrong!"}
        </span>
      )}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        {type === "create" ? "Create Student" : "Update Student"}
      </button>
    </form>
  );
};

export default StudentForm;
