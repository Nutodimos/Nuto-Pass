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
  | "assignmentSubmission"
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
          orderBy: { name: "asc" },
        });
        relatedData = { teachers: subjectTeachers };
        break;
      case "class":
        const [classGrades, classTeachers] = await prisma.$transaction([
          prisma.grade.findMany({ select: { id: true, level: true } }),
          prisma.teacher.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
        ]);
        relatedData = { teachers: classTeachers, grades: classGrades };
        break;
      case "teacher":
        const teacherSubjects = await prisma.subject.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
        relatedData = { subjects: teacherSubjects };
        break;
      case "student":
        const [studentGrades, studentClasses] = await prisma.$transaction([
          prisma.grade.findMany({ select: { id: true, level: true } }),
          prisma.class.findMany({ include: { _count: { select: { students: true } } }, orderBy: { name: "asc" } }),
        ]);
        relatedData = { classes: studentClasses, grades: studentGrades };
        break;

      case "announcement":
        let annClasses: any[] = [];
        let annSubjects: any[] = [];

        if (role === "admin") {
          annClasses = await prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
          annSubjects = await prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
        } else if (role === "teacher") {
          annClasses = await prisma.class.findMany({
            where: { supervisorId: currentUserId! },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
          annSubjects = await prisma.subject.findMany({
            where: { teachers: { some: { id: currentUserId! } } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          });
        }

        relatedData = { classes: annClasses, subjects: annSubjects, role };
        break;

      case "material":
        const [materialClasses, materialSubjects] = await prisma.$transaction([
          prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
          prisma.subject.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        ]);
        relatedData = { classes: materialClasses, subjects: materialSubjects, role };
        break;

      case "lesson":
        const [lessonClasses, lessonSubjects] = await prisma.$transaction([
          prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
          prisma.subject.findMany({
            select: {
              id: true,
              name: true,
              teachers: { select: { id: true, name: true, surname: true } },
            },
            orderBy: { name: "asc" },
          }),
        ]);
        relatedData = { classes: lessonClasses, subjects: lessonSubjects };
        break;

      case "assignment":
        const assignmentQuery: any = {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        };

        // If the user is a teacher, they should only be able to assign work to their own subjects
        if (role === "teacher") {
          assignmentQuery.where = { teachers: { some: { id: currentUserId! } } };
        }

        const assignmentSubjects = await prisma.subject.findMany(assignmentQuery);

        relatedData = { subjects: assignmentSubjects };
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
