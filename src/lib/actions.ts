"use server";

import { revalidatePath } from "next/cache";
import {
  ClassSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
  AssignmentSchema,
  AssignmentSubmissionSchema,
  AnnouncementSchema,
  LessonSchema,
  MaterialSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { getTenantClient } from "./prisma-tenant";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Day } from "@prisma/client";
import { handleActionError } from "./utils";

type CurrentState = { success: boolean; error: boolean; messages?: string[] };

/**
 * Checks that the current user has one of the allowed roles.
 * Returns the userId, role, and organizationId if authorized, otherwise returns an error state.
 */
const requireRole = (
  allowedRoles: string[],
):
  | { authorized: true; userId: string; role: string; organizationId: string }
  | { authorized: false; error: CurrentState } => {
  const { userId, sessionClaims } = auth();
  const metadata = sessionClaims?.metadata as { role?: string; organizationId?: string } | undefined;
  const role = metadata?.role;
  const organizationId = metadata?.organizationId;

  if (!userId || !role) {
    return {
      authorized: false,
      error: { success: false, error: true, messages: ["Not authenticated"] },
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      authorized: false,
      error: {
        success: false,
        error: true,
        messages: ["Unauthorized: insufficient permissions"],
      },
    };
  }

  if (!organizationId) {
    return {
      authorized: false,
      error: { success: false, error: true, messages: ["No organization context"] },
    };
  }

  return { authorized: true, userId, role, organizationId };
};

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.subject.create({
      data: {
        name: data.name,
        title: data.title || null,
        credits: data.credits === "" ? null : data.credits,
        level: !data.level || data.level === 0 ? null : data.level,
        semester: data.semester === "" ? null : data.semester,
        status: data.status || null,
        organizationId: authCheck.organizationId,
        teachers: {
          connect: (data.teachers || []).map((teacherId) => ({ id: teacherId })),
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
  data: SubjectSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        title: data.title || null,
        credits: data.credits === "" ? null : data.credits,
        level: !data.level || data.level === 0 ? null : data.level,
        semester: data.semester === "" ? null : data.semester,
        status: data.status || null,
        teachers: {
          set: (data.teachers || []).map((teacherId) => ({ id: teacherId })),
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.subject.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/list/courses");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.class.create({
      data: {
        name: data.name,
        gradeId: data.gradeId,
        id: data.id,
        supervisorId: data.supervisorId,
        organizationId: authCheck.organizationId,
      },
    });

    revalidatePath("/list/levels");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.class.update({
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.class.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/list/levels");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    const user = await clerkClient().users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "teacher", organizationId: authCheck.organizationId },
      ...(data.email ? { emailAddress: [data.email] } : {}),
    });

    await db.teacher.create({
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
        organizationId: authCheck.organizationId,
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
  data: TeacherSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

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
      console.error("Clerk user update failed:", e);
    }

    await db.teacher.update({
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    try {
      await clerkClient().users.deleteUser(id);
    } catch (e) {
      console.error("Clerk user delete failed:", e);
    }

    await db.teacher.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/list/lecturers");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);
  try {
    const classItem = await db.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    const user = await clerkClient().users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata: { role: "student", organizationId: authCheck.organizationId },
      ...(data.email ? { emailAddress: [data.email] } : {}),
    });

    await db.student.create({
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
        organizationId: authCheck.organizationId,
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
  data: StudentSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

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
      console.error("Clerk user update failed:", e);
    }

    await db.student.update({
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    try {
      await clerkClient().users.deleteUser(id);
    } catch (e) {
      console.error("Clerk user delete failed (ignorable if user missing):", e);
    }

    await db.student.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const createAssignment = async (
  currentState: CurrentState,
  data: AssignmentSchema,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.assignment.create({
      data: {
        title: data.title,
        description: data.description || null,
        attachmentUrl: data.attachmentUrl || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        subjectId: data.subjectId,
        organizationId: authCheck.organizationId,
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
  data: AssignmentSchema,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.assignment.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description || null,
        attachmentUrl: data.attachmentUrl || null,
        startDate: data.startDate,
        dueDate: data.dueDate,
        subjectId: data.subjectId,
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.assignment.delete({
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

export const createAssignmentSubmission = async (
  currentState: CurrentState,
  data: AssignmentSubmissionSchema,
) => {
  const authCheck = requireRole(["admin", "teacher", "student"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    // Uses upsert so a student can re-submit and overwrite their previous submission URL
    await db.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: data.studentId,
        },
      },
      update: {
        submissionUrl: data.submissionUrl,
        submissionDate: new Date(),
      },
      create: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        submissionUrl: data.submissionUrl,
        organizationId: authCheck.organizationId,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const gradeAssignmentSubmission = async (
  submissionId: number,
  grade: number,
  feedback?: string,
) => {
  const authResult = requireRole(["admin", "teacher"]);
  if (!authResult.authorized) return authResult.error;
  const db = getTenantClient(authResult.organizationId);

  try {
    await db.assignmentSubmission.update({
      where: {
        id: submissionId,
      },
      data: {
        grade,
        feedback: feedback || null,
      },
    });

    revalidatePath("/list/assignments");
    return { success: true, error: false };
  } catch (err) {
    console.error("Grading failed", err);
    return { success: false, error: true };
  }
};

export const updateAttendance = async (
  lessonId: number,
  studentId: string,
  present: boolean,
  dateStr?: string, // Optional parameter for historical updates
) => {
  const authResult = requireRole(["admin", "teacher"]);
  if (!authResult.authorized) return authResult.error;
  const db = getTenantClient(authResult.organizationId);
  try {
    const lesson = await db.lesson.findUnique({
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

    const attendance = await db.attendance.findFirst({
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
      await db.attendance.update({
        where: { id: attendance.id },
        data: { present },
      });
    } else {
      await db.attendance.create({
        data: {
          lessonId,
          studentId,
          present,
          // Reset targetDate to avoid saving 23:59:59 if it hit the endOfDay logic
          date: dateStr ? new Date(dateStr) : new Date(),
          organizationId: authResult.organizationId,
        },
      });
    }

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateSchoolConfig = async (
  currentState: CurrentState,
  formData: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const sessionYear = formData.get("sessionYear") as string;
  const currentSemester = formData.get("currentSemester") as string;

  if (!sessionYear) {
    return {
      success: false,
      error: true,
      messages: ["Session year is required"],
    };
  }

  try {
    // 1. Fetch old configs to tag untagged records for archiving
    const [oldSessionConfig, oldSemesterConfig] = await Promise.all([
      db.schoolConfig.findFirst({ where: { key: "sessionYear" } }),
      db.schoolConfig.findFirst({ where: { key: "currentSemester" } }),
    ]);

    const oldSession = oldSessionConfig?.value || "2024/25";
    const oldSemester = oldSemesterConfig?.value ? parseInt(oldSemesterConfig.value) : 1;

    // 2. Tag any untagged sessions and attendances before resetting
    await db.attendanceSession.updateMany({
      where: { organizationId: authCheck.organizationId, academicSession: null },
      data: { academicSession: oldSession, semester: oldSemester }
    });

    await db.attendance.updateMany({
      where: { organizationId: authCheck.organizationId, academicSession: null },
      data: { academicSession: oldSession, semester: oldSemester }
    });

    // 3. Reset/Close any currently active attendance sessions for the new session update
    await db.attendanceSession.updateMany({
      where: { organizationId: authCheck.organizationId, status: "OPEN" },
      data: { status: "CLOSED", endTime: new Date() }
    });

    // Reset ESP32 biometric device to IDLE
    await db.deviceHeartbeat.updateMany({
      where: { organizationId: authCheck.organizationId, deviceId: "ESP32_MAIN" },
      data: { pendingCommand: "VERIFY:STOP" }
    });

    // 4. Update session year
    await db.schoolConfig.upsert({
      where: { organizationId_key: { organizationId: authCheck.organizationId, key: "sessionYear" } },
      update: { value: sessionYear },
      create: { key: "sessionYear", value: sessionYear, organizationId: authCheck.organizationId },
    });

    // Update current semester
    if (currentSemester) {
      await db.schoolConfig.upsert({
        where: { organizationId_key: { organizationId: authCheck.organizationId, key: "currentSemester" } },
        update: { value: currentSemester },
        create: { key: "currentSemester", value: currentSemester, organizationId: authCheck.organizationId },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/settings");
    revalidatePath("/list/courses");
    revalidatePath("/list/attendance");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      messages: ["Failed to update settings"],
    };
  }
};

export const updateProfile = async (
  currentState: CurrentState,
  formData: FormData,
) => {
  const { userId, sessionClaims } = auth();
  const metadata = sessionClaims?.metadata as { role?: string; organizationId?: string } | undefined;
  const role = metadata?.role;
  const organizationId = metadata?.organizationId;

  if (!userId) {
    return { success: false, error: true, messages: ["Not authenticated"] };
  }
  if (!organizationId) {
    return { success: false, error: true, messages: ["No organization context"] };
  }

  const db = getTenantClient(organizationId);

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
      await db.teacher.update({
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
      await db.student.update({
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
      return {
        success: false,
        error: true,
        messages: ["Admin profiles cannot be updated here"],
      };
    }

    revalidatePath("/settings");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      messages: ["Failed to update profile"],
    };
  }
};

export const createAnnouncement = async (
  currentState: CurrentState,
  data: AnnouncementSchema,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        targetAudience: data.targetAudience,
        classId: data.classId || null,
        subjectId: data.subjectId || null,
        organizationId: authCheck.organizationId,
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
  data: AnnouncementSchema,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    await db.announcement.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        targetAudience: data.targetAudience,
        classId: data.classId || null,
        subjectId: data.subjectId || null,
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.announcement.delete({
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
  data: MaterialSchema,
) => {
  const { userId, sessionClaims } = await auth();
  const metadata = sessionClaims?.metadata as { role?: string; organizationId?: string } | undefined;
  const role = metadata?.role;
  const organizationId = metadata?.organizationId;
  const currentUserId = userId;

  if (!organizationId) {
    return { success: false, error: true };
  }
  const db = getTenantClient(organizationId);

  try {
    const teacherId = role === "teacher" ? currentUserId : null;
    const isGeneral = data.isGeneral || false;

    // Create the material
    const material = await db.material.create({
      data: {
        title: data.title,
        filePath: data.filePath,
        subjectId: data.subjectId,
        classId: isGeneral ? null : data.classId,
        teacherId: teacherId,
        isGeneral: isGeneral,
        organizationId,
      },
      include: {
        subject: true,
        class: true,
      },
    });

    // Create an announcement to notify users (shows in existing notification bell)
    if (isGeneral) {
      await db.announcement.create({
        data: {
          title: `📚 New General Document: ${material.title}`,
          description: `A new document "${material.title}" has been uploaded in ${(material as any).subject.name}. Check the Materials page to view it.`,
          date: new Date(),
          targetAudience: "all",
          classId: null,
          organizationId,
        },
      });
    } else if (data.classId) {
      await db.announcement.create({
        data: {
          title: `📄 New Course Material: ${material.title}`,
          description: `New material "${material.title}" for ${(material as any).subject.name} has been uploaded. Check the Materials page to view it.`,
          date: new Date(),
          targetAudience: "students",
          classId: data.classId,
          organizationId,
        },
      });
    }

    revalidatePath("/list/materials");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const deleteMaterial = async (
  currentState: CurrentState,
  data: FormData,
) => {
  const authCheck = requireRole(["admin", "teacher"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.material.delete({
      where: {
        id: parseInt(id),
      },
    });

    revalidatePath("/list/materials");
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: LessonSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    // Auto-generate lesson name from subject and class
    const [subject, classData] = await Promise.all([
      db.subject.findUnique({
        where: { id: data.subjectId },
        select: { name: true },
      }),
      db.class.findUnique({
        where: { id: data.classId },
        select: { name: true },
      }),
    ]);

    await db.lesson.create({
      data: {
        name: `${subject?.name || "Lesson"} - ${classData?.name || "Class"}`,
        day: data.day as Day,
        startTime: data.startTime,
        endTime: data.endTime,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
        organizationId: authCheck.organizationId,
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
  data: LessonSchema,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  try {
    // Auto-generate lesson name from subject and class
    const [subject, classData] = await Promise.all([
      db.subject.findUnique({
        where: { id: data.subjectId },
        select: { name: true },
      }),
      db.class.findUnique({
        where: { id: data.classId },
        select: { name: true },
      }),
    ]);

    await db.lesson.update({
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
  data: FormData,
) => {
  const authCheck = requireRole(["admin"]);
  if (!authCheck.authorized) return authCheck.error;
  const db = getTenantClient(authCheck.organizationId);

  const id = data.get("id") as string;
  try {
    await db.lesson.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const markAnnouncementAsRead = async (announcementId: number) => {
  const { userId, sessionClaims } = auth();
  const organizationId = (sessionClaims?.metadata as any)?.organizationId;

  if (!userId) {
    return { success: false, error: true, messages: ["Not authenticated"] };
  }
  if (!organizationId) {
    return { success: false, error: true, messages: ["No organization context"] };
  }

  const db = getTenantClient(organizationId);

  try {
    await db.announcementRead.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      update: {},
      create: { announcementId, userId, organizationId },
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};

export const markAllAnnouncementsAsRead = async () => {
  const { userId, sessionClaims } = auth();
  const organizationId = (sessionClaims?.metadata as any)?.organizationId;

  if (!userId) {
    return { success: false, error: true, messages: ["Not authenticated"] };
  }
  if (!organizationId) {
    return { success: false, error: true, messages: ["No organization context"] };
  }

  const db = getTenantClient(organizationId);

  try {
    const announcements = await db.announcement.findMany({
      select: { id: true },
    });

    await db.announcementRead.createMany({
      data: announcements.map((a) => ({
        announcementId: a.id,
        userId,
        organizationId,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/list/announcements");
    return { success: true, error: false };
  } catch (err) {
    return handleActionError(err);
  }
};
