"use client";

import {
  deleteClass,
  deleteStudent,
  deleteSubject,
  deleteTeacher,
  deleteAssignment,
  deleteGrade,
  deleteAnnouncement,
  deleteMaterial,
  deleteLesson,
} from "@/lib/actions";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

const deleteActionMap = {
  subject: deleteSubject,
  class: deleteClass,
  teacher: deleteTeacher,
  student: deleteStudent,
  // exam: deleteExam, NO EXAMS
  // TODO: OTHER DELETE ACTIONS
  // parent: deleteSubject, NO PARENTS
  lesson: deleteLesson,
  assignment: deleteAssignment,
  // result: deleteSubject, NO RESULTS
  attendance: deleteSubject,
  event: deleteSubject,
  announcement: deleteAnnouncement,
  grade: deleteGrade,
  material: deleteMaterial,
};

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});

const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const GradeForm = dynamic(() => import("./forms/GradeForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const MaterialForm = dynamic(() => import("./forms/MaterialForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  ssr: false,
  loading: () => <h1>Loading...</h1>,
});
// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: any,
    relatedData?: any
  ) => JSX.Element;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  assignment: (setOpen, type, data, relatedData) => (
    <AssignmentForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  grade: (setOpen, type, data, relatedData) => (
    <GradeForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  announcement: (setOpen, type, data, relatedData) => (
    <AnnouncementForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  material: (setOpen, type, data, relatedData) => (
    <MaterialForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
  lesson: (setOpen, type, data, relatedData) => (
    <LessonForm
      type={type}
      data={data}
      setOpen={setOpen}
      relatedData={relatedData}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: any }) => {
  const size = type === "create" ? "w-14 h-14" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-gradient-to-br from-nutoOrange to-nutoOrangeDark text-white"
      : type === "update"
        ? "bg-nutoSlate"
        : "bg-red-500";

  const [open, setOpen] = useState(false);

  const Form = () => {
    const [state, formAction] = useFormState(deleteActionMap[table], {
      success: false,
      error: false,
    });

    const router = useRouter();

    useEffect(() => {
      if (state.success) {
        toast(`${table} has been deleted!`);
        setOpen(false);
        router.refresh();
      } else if (state.error) {
        toast.error((state as any).messages ? (state as any).messages[0] : "Deletion failed! Ensure no related data exists.");
      }
    }, [state, router]);

    return type === "delete" && id ? (
      <form action={formAction} className="p-4 flex flex-col gap-4">
        <input type="text" name="id" value={id} hidden />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <button className="bg-red-600 text-white py-2 px-4 rounded-md border-none w-max self-center btn-nuto hover:bg-red-700">
          Delete
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table] ? (
        forms[table](setOpen, type, data, relatedData)
      ) : (
        <div className="p-4 text-center">
          <p className="text-slate-600 font-medium mb-2">Form not available</p>
          <p className="text-sm text-slate-500">
            The form for "{table}" has not been implemented yet.
          </p>
        </div>
      )
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor} ${type === "create"
          ? "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          : ""
          }`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={type === "create" ? 24 : 16} height={type === "create" ? 24 : 16} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="w-screen h-screen fixed left-0 top-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 pb-8 overflow-y-auto animate-fade-in">
          <div
            className="bg-white p-6 rounded-2xl relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl animate-scale-in my-auto"
            style={{
              animation: "scale-in 0.3s ease-out"
            }}
          >
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer p-2 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
          <style jsx>{`
            @keyframes scale-in {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-scale-in {
              animation: scale-in 0.3s ease-out;
            }
            .animate-fade-in {
              animation: fade-in 0.2s ease-out;
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
};

export default FormModal;
