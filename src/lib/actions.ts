"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AssignmentSchema,
  AnnouncementSchema,
  LessonSchema,
  MaterialSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Day } from "@prisma/client";
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

    revalidatePath("/list/courses");
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

    revalidatePath("/list/courses");
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
  console.log("Triggering Soft Delete for Subject ID:", id); // Next.js cache break
  try {
    await prisma.subject.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/list/courses");
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

    revalidatePath("/list/levels");
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

    revalidatePath("/list/levels");
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
    await prisma.class.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/list/levels");
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

    revalidatePath("/list/lecturers");
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
    revalidatePath("/list/lecturers");
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

    await prisma.teacher.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/list/lecturers");
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

    revalidatePath("/list/students");
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
    revalidatePath("/list/students");
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

    await prisma.student.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/list/students");
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

    revalidatePath("/list/assignments");
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

    revalidatePath("/list/assignments");
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

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateAttendance = async (
  lessonId: number,
  studentId: string,
  present: boolean,
  dateStr?: string // Optional parameter for historical updates
) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return { success: false, error: true };
    }

    // Use provided date or default to today
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // Create start and end of day bounds for the target date
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.findFirst({
      where: {
        lessonId: lessonId,
        studentId: studentId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
          // Reset targetDate to avoid saving 23:59:59 if it hit the endOfDay logic
          date: dateStr ? new Date(dateStr) : new Date(),
        },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
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

export const updateProfile = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    return { success: false, error: true, messages: ["Not authenticated"] };
  }

  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const address = (formData.get("address") as string) || null;
  const bloodType = (formData.get("bloodType") as string) || null;
  const sex = formData.get("sex") as string;
  const birthdayStr = formData.get("birthday") as string;
  const birthday = birthdayStr ? new Date(birthdayStr) : undefined;
  const img = formData.get("img") as string | null;

  try {
    if (role === "teacher") {
      await prisma.teacher.update({
        where: { id: userId },
        data: {
          email,
          phone,
          address,
          bloodType,
          sex: sex ? (sex as any) : undefined,
          ...(birthday ? { birthday } : {}),
          ...(img !== null ? { img } : {}),
        },
      });
    } else if (role === "student") {
      await prisma.student.update({
        where: { id: userId },
        data: {
          email,
          phone,
          address: address || "",
          bloodType,
          sex: sex ? (sex as any) : undefined,
          ...(birthday ? { birthday } : {}),
          ...(img !== null ? { img } : {}),
        },
      });
    } else {
      return { success: false, error: true, messages: ["Admin profiles cannot be updated here"] };
    }

    revalidatePath("/settings");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true, messages: ["Failed to update profile"] };
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

    revalidatePath("/list/announcements");
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

    revalidatePath("/list/announcements");
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

    revalidatePath("/list/materials");
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

    revalidatePath("/list/materials");
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
    // Auto-generate lesson name from subject and class
    const [subject, classData] = await prisma.$transaction([
      prisma.subject.findUnique({ where: { id: data.subjectId }, select: { name: true } }),
      prisma.class.findUnique({ where: { id: data.classId }, select: { name: true } }),
    ]);

    await prisma.lesson.create({
      data: {
        name: `${subject?.name || "Lesson"} - ${classData?.name || "Class"}`,
        day: data.day as Day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
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
    // Auto-generate lesson name from subject and class
    const [subject, classData] = await prisma.$transaction([
      prisma.subject.findUnique({ where: { id: data.subjectId }, select: { name: true } }),
      prisma.class.findUnique({ where: { id: data.classId }, select: { name: true } }),
    ]);

    await prisma.lesson.update({
      where: {
        id: data.id,
      },
      data: {
        name: `${subject?.name || "Lesson"} - ${classData?.name || "Class"}`,
        day: data.day as Day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    revalidatePath("/list/lessons");
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
    await prisma.lesson.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      }
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};
