"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,

  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AssignmentSchema,
  GradeSchema,
  AnnouncementSchema,
  LessonSchema,
  MaterialSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { handleActionError } from "./utils";

type CurrentState = { success: boolean; error: boolean; messages?: string[] };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        semester: data.semester === "" ? null : data.semester,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        semester: data.semester === "" ? null : data.semester,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.subject.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient().users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher" },
      ...(data.email ? { emailAddress: [data.email] } : {}),
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType || null,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    try {
      await clerkClient().users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
      });
    } catch (e) {
      console.log("Clerk user update failed (ignorable for seed data):", e);
    }

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType || null,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    try {
      await clerkClient().users.deleteUser(id);
    } catch (e) {
      // User might not exist in Clerk (e.g. seed data), proceed to delete from DB
      console.log("Clerk user delete failed (ignorable if user missing):", e);
    }

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    // Capacity check removed


    const user = await clerkClient().users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student" },
      ...(data.email ? { emailAddress: [data.email] } : {}),
    });

    await prisma.student.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType || null,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    try {
      await clerkClient().users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
      });
    } catch (e) {
      console.log("Clerk user update failed (ignorable for seed data):", e);
    }

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType || null,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    try {
      await clerkClient().users.deleteUser(id);
    } catch (e) {
      console.log("Clerk user delete failed (ignorable if user missing):", e);
    }

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};


export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.create({
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema
) => {
  try {
    await prisma.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startDate: data.startDate,
        dueDate: data.dueDate,
        lessonId: data.lessonId,
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteAssignment = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.assignment.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateAttendance = async (
  lessonId: number,
  studentId: string,
  present: boolean
) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return { success: false, error: true };
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        lessonId: lessonId,
        studentId: studentId,
      },
    });

    if (attendance) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { present },
      });
    } else {
      await prisma.attendance.create({
        data: {
          lessonId,
          studentId,
          present,
          date: new Date(),
        },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.create({
      data: {
        level: data.level,
      },
    });

    // revalidatePath("/list/levels");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateGrade = async (
  currentState: CurrentState,
  data: GradeSchema
) => {
  try {
    await prisma.grade.update({
      where: {
        id: data.id,
      },
      data: {
        level: data.level,
      },
    });

    // revalidatePath("/list/levels");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteGrade = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.grade.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/levels");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateSchoolConfig = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const sessionYear = formData.get("sessionYear") as string;
  const currentSemester = formData.get("currentSemester") as string;

  if (!sessionYear) {
    return { success: false, error: true, messages: ["Session year is required"] };
  }

  try {
    // Update session year
    await prisma.schoolConfig.upsert({
      where: { key: "sessionYear" },
      update: { value: sessionYear },
      create: { key: "sessionYear", value: sessionYear },
    });

    // Update current semester
    if (currentSemester) {
      await prisma.schoolConfig.upsert({
        where: { key: "currentSemester" },
        update: { value: currentSemester },
        create: { key: "currentSemester", value: currentSemester },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/settings");
    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, messages: ["Failed to update settings"] };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        targetAudience: data.targetAudience,
        classId: data.classId || null,
      },
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema
) => {
  try {
    await prisma.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        targetAudience: data.targetAudience,
        classId: data.classId || null,
      },
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteAnnouncement = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createMaterial = async (
  currentState: CurrentState,
  data: MaterialSchema
) => {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const currentUserId = userId;

  try {
    const teacherId = role === "teacher" ? currentUserId : null;
    const isGeneral = data.isGeneral || false;

    // Create the material
    const material = await prisma.material.create({
      data: {
        title: data.title,
        filePath: data.filePath,
        subjectId: data.subjectId,
        classId: isGeneral ? null : data.classId,
        teacherId: teacherId,
        isGeneral: isGeneral,
      },
      include: {
        subject: true,
        class: true,
      },
    });

    // Create an announcement to notify users (shows in existing notification bell)
    if (isGeneral) {
      // General document - notify all users
      await prisma.announcement.create({
        data: {
          title: `📚 New General Document: ${material.title}`,
          description: `A new document "${material.title}" has been uploaded in ${material.subject.name}. Check the Materials page to view it.`,
          date: new Date(),
          targetAudience: "all",
          classId: null,
        },
      });
    } else if (data.classId) {
      // Class-specific material - notify students in that class
      await prisma.announcement.create({
        data: {
          title: `📄 New Course Material: ${material.title}`,
          description: `New material "${material.title}" for ${material.subject.name} has been uploaded. Check the Materials page to view it.`,
          date: new Date(),
          targetAudience: "students",
          classId: data.classId,
        },
      });
    }

    // revalidatePath("/list/materials");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};



export const deleteMaterial = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.material.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/materials");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    await prisma.lesson.create({
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: LessonSchema
) => {
  try {
    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};
