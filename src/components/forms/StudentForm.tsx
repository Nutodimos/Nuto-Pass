"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  studentSchema,
  StudentSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import {
  createStudent,
  updateStudent,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { useTaxonomy } from "@/hooks/use-taxonomy";
import { useOrgMetadata } from "@/components/OrgMetadataProvider";
import { KeyRound, AlertCircle } from "lucide-react";

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
  const taxonomy = useTaxonomy();
  const { institutionType } = useOrgMetadata();

  const isUni = institutionType === "UNIVERSITY_DEPARTMENT";
  const isSchool = institutionType === "SECONDARY_SCHOOL" || institutionType === "PRIMARY_SCHOOL";
  const idLabel = isUni ? "Matric No." : isSchool ? "Admission No. / ID" : "Student ID / Username";

  const [autoPassword, setAutoPassword] = useState(type === "create");
  const [img, setImg] = useState<any>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      ...data,
      id: data?.id,
      username: data?.username || "",
      name: data?.name || "",
      surname: data?.surname || "",
      email: data?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      bloodType: data?.bloodType || "",
      sex: data?.sex || "MALE",
      birthday: data?.birthday ? new Date(data.birthday).toISOString().split("T")[0] : undefined,
      classId: data?.classId || relatedData?.classes?.[0]?.id,
      gradeId: data?.gradeId || relatedData?.classes?.[0]?.gradeId,
    },
  });

  const usernameVal = watch("username");

  const [state, formAction] = useFormState(
    type === "create" ? createStudent : updateStudent,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((formData) => {
    let finalPassword = formData.password;
    if (autoPassword && type === "create") {
      finalPassword = formData.username;
    }

    // Auto-resolve gradeId if not already set
    let finalGradeId = formData.gradeId;
    if (!finalGradeId && formData.classId && relatedData?.classes) {
      const matched = relatedData.classes.find((c: any) => c.id === Number(formData.classId));
      if (matched?.gradeId) finalGradeId = matched.gradeId;
    }

    formAction({
      ...formData,
      password: finalPassword,
      gradeId: finalGradeId,
      img: img?.secure_url || data?.img,
    });
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success(`${taxonomy.student} ${type === "create" ? "created" : "updated"} successfully!`);
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error((state as any).messages ? (state as any).messages.join("\n") : "Something went wrong!");
    }
  }, [state, router, type, setOpen, taxonomy.student]);

  const { classes = [] } = relatedData || {};

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-CPENavy to-CPENavyDark flex items-center justify-center">
          <span className="text-white font-bold">{taxonomy.student.charAt(0)}</span>
        </div>
        <h1 className="text-xl font-bold text-CPENavyDark">
          {type === "create" ? `Create New ${taxonomy.student}` : `Update ${taxonomy.student}`}
        </h1>
      </div>

      {/* SECTION 1: AUTHENTICATION */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-CPENavy"></div>
        <span className="text-sm font-semibold text-CPENavy">Authentication Information</span>
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label={idLabel}
          name="username"
          defaultValue={data?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Email (Optional)"
          name="email"
          defaultValue={data?.email}
          register={register}
          error={errors?.email}
        />

        {type === "create" ? (
          <div className="w-full flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={autoPassword}
                onChange={(e) => setAutoPassword(e.target.checked)}
                className="w-4 h-4 text-CPENavy rounded border-slate-300 focus:ring-CPENavy focus:ring-offset-0"
              />
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-4 h-4 text-CPEGold" />
                Use {idLabel} as default password {usernameVal ? `("${usernameVal}")` : ""}
              </span>
            </label>

            {!autoPassword && (
              <div className="mt-1">
                <InputField
                  label="Custom Password"
                  name="password"
                  type="password"
                  defaultValue={data?.password}
                  register={register}
                  error={errors?.password}
                />
              </div>
            )}
          </div>
        ) : (
          <InputField
            label="Change Password (Optional)"
            name="password"
            type="password"
            register={register}
            error={errors?.password}
          />
        )}
      </div>

      {/* SECTION 2: PERSONAL INFO */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-CPEGold"></div>
        <span className="text-sm font-semibold text-CPEGold">Personal Information</span>
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

        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-sm font-medium text-CPENavyDark">Sex</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("sex")}
            defaultValue={data?.sex || "MALE"}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">{errors.sex.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-sm font-medium text-CPENavyDark">{taxonomy.class}</label>
          <select
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm text-gray-800 focus:border-CPENavy focus:bg-white focus:outline-none transition-all duration-200"
            {...register("classId")}
            defaultValue={data?.classId || classes[0]?.id}
            onChange={(e) => {
              const selectedClassId = parseInt(e.target.value);
              const selectedClass = (classes as any[]).find((c) => c.id === selectedClassId);
              if (selectedClass?.gradeId) {
                setValue("gradeId", selectedClass.gradeId);
              }
            }}
          >
            {classes.map(
              (classItem: {
                id: number;
                name: string;
                gradeId?: number;
              }) => (
                <option value={classItem.id} key={classItem.id}>
                  {classItem.name}
                </option>
              )
            )}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
          )}
        </div>
      </div>

      {/* PHOTO UPLOAD */}
      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "school"}
          onSuccess={(result, { widget }) => {
            setImg(result.info);
            widget.close();
          }}
        >
          {({ open }) => (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-CPENavy hover:bg-CPENavy/5 transition-all cursor-pointer"
              onClick={() => open()}
            >
              <div className="w-10 h-10 rounded-lg bg-CPENavy/10 flex items-center justify-center">
                <Image src="/upload.png" alt="" width={20} height={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Upload photo (Optional)</p>
                <p className="text-xs text-gray-400">Click to browse or drop an image</p>
              </div>
            </div>
          )}
        </CldUploadWidget>
      ) : null}

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
        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-CPENavy to-CPENavyDark text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        {type === "create" ? `Create ${taxonomy.student}` : `Update ${taxonomy.student}`}
      </button>
    </form>
  );
};

export default StudentForm;
