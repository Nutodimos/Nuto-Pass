import prisma from "@/lib/prisma";
import FormModal from "./FormModal";
import { auth } from "@clerk/nextjs/server";

export type FormContainerProps = {
  table:
  | "teacher"
  | "student"
  | "subject"
  | "class"
  | "lesson"
  | "assignment"
  | "attendance"
  | "event"
  | "announcement"
  | "material";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
};

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  if (type !== "delete") {
    switch (table) {
      case "subject":
        const subjectTeachers = await prisma.teacher.findMany({
          select: { id: true, name: true, surname: true },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const [classGrades, classTeachers] = await prisma.$transaction([
          prisma.grade.findMany({ select: { id: true, level: true } }),
          prisma.teacher.findMany({ select: { id: true, name: true, surname: true } }),
        ]);
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const [studentGrades, studentClasses] = await prisma.$transaction([
          prisma.grade.findMany({ select: { id: true, level: true } }),
          prisma.class.findMany({ include: { _count: { select: { students: true } } } }),
        ]);
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;

      case "announcement":
        const classes = await prisma.class.findMany({
          select: { id: true, name: true },
        });
        relatedData = { classes };
        break;

      case "material":
        const [materialClasses, materialSubjects] = await prisma.$transaction([
          prisma.class.findMany({ select: { id: true, name: true } }),
          prisma.subject.findMany({ select: { id: true, name: true } }),
        ]);
        relatedData = { classes: materialClasses, subjects: materialSubjects, role };
        break;

      case "lesson":
        const [lessonClasses, lessonSubjects] = await prisma.$transaction([
          prisma.class.findMany({ select: { id: true, name: true } }),
          prisma.subject.findMany({
            select: {
              id: true,
              name: true,
              teachers: { select: { id: true, name: true, surname: true } },
            },
          }),
        ]);
        relatedData = { classes: lessonClasses, subjects: lessonSubjects };
        break;

      default:
        break;
    }
  }

  return (
    <div className="">
      <FormModal
        table={table}
        type={type}
        data={data}
        id={id}
        relatedData={relatedData}
      />
    </div>
  );
};

export default FormContainer;
