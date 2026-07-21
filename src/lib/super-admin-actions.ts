"use server";

import prisma from "./prisma-base";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { setClerkUserMetadata } from "./clerk-metadata";
import { revalidatePath } from "next/cache";
import type { OrgMetadata, InstitutionType } from "@/types/organization";
import { getSeedTemplate } from "./seed-templates";
import type { PrismaClient, Prisma } from "@prisma/client";

type CurrentState = { success: boolean; error: boolean; messages?: string[] };

/**
 * Guard: ensures the caller is a SUPER_ADMIN.
 */
function requireSuperAdmin() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "super_admin") {
    return { authorized: false as const, error: { success: false, error: true, messages: ["Unauthorized"] } };
  }
  return { authorized: true as const, userId };
}

/**
 * Shared helper to delete all organization data in order of foreign-key constraints.
 */
async function deleteOrgCascade(orgId: string, client: PrismaClient | Prisma.TransactionClient) {
  await client.assignmentSubmission.deleteMany({ where: { organizationId: orgId } });
  await client.attendance.deleteMany({ where: { organizationId: orgId } });
  await client.attendanceSession.deleteMany({ where: { organizationId: orgId } });
  await client.assignment.deleteMany({ where: { organizationId: orgId } });
  await client.lesson.deleteMany({ where: { organizationId: orgId } });
  await client.subject.deleteMany({ where: { organizationId: orgId } });
  await client.courseEnrollment.deleteMany({ where: { organizationId: orgId } });
  await client.student.deleteMany({ where: { organizationId: orgId } });
  await client.teacher.deleteMany({ where: { organizationId: orgId } });
  await client.class.deleteMany({ where: { organizationId: orgId } });
  await client.grade.deleteMany({ where: { organizationId: orgId } });
  await client.announcementRead.deleteMany({ where: { organizationId: orgId } });
  await client.announcement.deleteMany({ where: { organizationId: orgId } });
  await client.material.deleteMany({ where: { organizationId: orgId } });
  await client.notification.deleteMany({ where: { organizationId: orgId } });
  await client.schoolConfig.deleteMany({ where: { organizationId: orgId } });
  await client.deviceHeartbeat.deleteMany({ where: { organizationId: orgId } });
  await client.user.deleteMany({ where: { organizationId: orgId } });
  await client.organization.delete({ where: { id: orgId } });
}

// ── Dashboard Stats ─────────────────────────────────────────────

export async function getSuperAdminStats() {
  const check = requireSuperAdmin();
  if (!check.authorized) return null;

  const [orgCount, userCount, teacherCount, studentCount, recentOrgs] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { users: true, teachers: true, students: true } },
      },
    }),
  ]);

  return { orgCount, userCount, teacherCount, studentCount, recentOrgs };
}

// ── Organisation CRUD ───────────────────────────────────────────

export async function getOrganizations() {
  const check = requireSuperAdmin();
  if (!check.authorized) return [];

  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, teachers: true, students: true } },
    },
  });
}

export async function getOrganizationById(id: string) {
  const check = requireSuperAdmin();
  if (!check.authorized) return null;

  return prisma.organization.findUnique({
    where: { id },
    include: {
      users: true,
      _count: { select: { teachers: true, students: true, subjects: true, classes: true } },
    },
  });
}

export async function createOrganization(
  currentState: CurrentState,
  formData: FormData,
) {
  const check = requireSuperAdmin();
  if (!check.authorized) return check.error;

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const adminEmail = formData.get("adminEmail") as string;
  const adminFirstName = formData.get("adminFirstName") as string;
  const adminLastName = formData.get("adminLastName") as string;
  let adminUsername = formData.get("adminUsername") as string;
  let adminPassword = formData.get("adminPassword") as string;

  if (!name || !slug || !adminEmail) {
    return { success: false, error: true, messages: ["Name, slug, and admin email are required"] };
  }

  // Fallback auto-generation if fields are not filled/present
  if (!adminUsername || !adminUsername.trim()) {
    const emailPrefix = adminEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    // Ensure it's unique and conforms to username rules (alphanumeric/special chars)
    adminUsername = `${emailPrefix}_admin_${Math.random().toString(36).substring(2, 6)}`.toLowerCase().substring(0, 20);
  }
  if (!adminPassword || !adminPassword.trim()) {
    adminPassword = `Admin@${Math.random().toString(36).substring(2, 10).toUpperCase()}1!`;
  }

  try {
    // 1. Check slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      return { success: false, error: true, messages: ["An organization with this slug already exists"] };
    }

    const institutionType = (formData.get("institutionType") as InstitutionType) || "UNIVERSITY_DEPARTMENT";
    const template = getSeedTemplate(institutionType);

    // 2. Create the Organization row + seed default data atomically.
    //    All DB writes are inside a single transaction so any failure
    //    (e.g. duplicate subject/class name) rolls back the entire org creation.
    //    Clerk is an external HTTP call and cannot participate in a DB transaction;
    //    it is called after the transaction commits (see step 3).
    const org = await prisma.$transaction(async (tx) => {
      // 2a. Create org
      const newOrg = await tx.organization.create({
        data: { name, slug, institutionType },
      });

      // 2b. Seed Grade rows (createMany doesn't return IDs, so we create one-by-one
      //     to build the gradeLevel → id map needed by Class rows).
      const gradeLevelToId = new Map<number, number>();
      for (const grade of template.grades) {
        const created = await tx.grade.create({
          data: { level: grade.level, organizationId: newOrg.id },
        });
        gradeLevelToId.set(grade.level, created.id);
      }

      // 2c. Seed Class rows — each references a Grade by the level → id map.
      await tx.class.createMany({
        data: template.classes.map((cls) => ({
          name: cls.name,
          gradeId: gradeLevelToId.get(cls.gradeLevel)!,
          organizationId: newOrg.id,
        })),
        skipDuplicates: true,
      });

      // 2d. Seed Subject rows.
      await tx.subject.createMany({
        data: template.subjects.map((subjectName) => ({
          name: subjectName,
          organizationId: newOrg.id,
        })),
        skipDuplicates: true,
      });

      // 2e. Seed SchoolConfig key/value pairs.
      await tx.schoolConfig.createMany({
        data: template.schoolConfig.map((entry) => ({
          key: entry.key,
          value: entry.value,
          organizationId: newOrg.id,
        })),
        skipDuplicates: true,
      });

      return newOrg;
    });

    // 3. Create a Clerk user for the admin (invitation-style).
    //    This is outside the DB transaction because Clerk is an external service.
    let clerkUser;
    try {
      clerkUser = await clerkClient().users.createUser({
        emailAddress: [adminEmail],
        username: adminUsername,
        password: adminPassword,
        firstName: adminFirstName || undefined,
        lastName: adminLastName || undefined,
        publicMetadata: {
          role: "admin",
          organizationId: org.id,
          orgSlug: org.slug,
        },
      });
    } catch (clerkErr: any) {
      // Clerk failed — roll back all seeded DB data in FK-constraint order
      // before deleting the org itself.
      await deleteOrgCascade(org.id, prisma);
      const msg = clerkErr.errors?.[0]?.message || "Failed to create admin user in Clerk";
      return { success: false, error: true, messages: [msg] };
    }

    // 4. Create User record in our DB.
    await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: adminEmail,
        name: `${adminFirstName || ""} ${adminLastName || ""}`.trim() || null,
        role: "ADMIN",
        organizationId: org.id,
      },
    });

    revalidatePath("/super-admin/organisations");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Create org error:", err);
    return { success: false, error: true, messages: [err.message || "Something went wrong"] };
  }
}

export async function deactivateOrganization(orgId: string) {
  const check = requireSuperAdmin();
  if (!check.authorized) return check.error;

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: { isActive: false },
    });

    revalidatePath("/super-admin/organisations");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Deactivate org error:", err);
    return { success: false, error: true, messages: [err.message] };
  }
}

export async function deleteOrganization(orgId: string) {
  const check = requireSuperAdmin();
  if (!check.authorized) return check.error;

  try {
    // 1. Gather all Clerk IDs for users, teachers, students of this org
    const dbUsers = await prisma.user.findMany({ where: { organizationId: orgId }, select: { clerkId: true } });
    const dbTeachers = await prisma.teacher.findMany({ where: { organizationId: orgId }, select: { id: true } });
    const dbStudents = await prisma.student.findMany({ where: { organizationId: orgId }, select: { id: true } });

    const clerkIds = [
      ...dbUsers.map(u => u.clerkId),
      ...dbTeachers.map(t => t.id),
      ...dbStudents.map(s => s.id)
    ].filter(Boolean);

    // 2. Delete Clerk users
    for (const clerkId of clerkIds) {
      try {
        await clerkClient().users.deleteUser(clerkId);
      } catch (clerkErr) {
        console.error(`Failed to delete Clerk user ${clerkId}:`, clerkErr);
      }
    }

    // 3. Delete DB records in order of constraints
    await deleteOrgCascade(orgId, prisma);

    revalidatePath("/super-admin/organisations");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Delete org error:", err);
    return { success: false, error: true, messages: [err.message || "Failed to delete organization"] };
  }
}

// ── Org Metadata (UI Config) ────────────────────────────────────

export async function getOrgMetadata(orgId: string) {
  const check = requireSuperAdmin();
  if (!check.authorized) return null;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, institutionType: true, metadata: true },
  });

  return org;
}

export async function updateOrgMetadata(
  orgId: string,
  data: {
    institutionType: InstitutionType;
    metadata: Partial<OrgMetadata>;
  }
) {
  const check = requireSuperAdmin();
  if (!check.authorized) return { success: false, error: true, messages: ["Unauthorized"] };

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        institutionType: data.institutionType,
        metadata: data.metadata as any,
      },
    });

    revalidatePath(`/super-admin/organisations/${orgId}`);
    revalidatePath(`/super-admin/organisations/${orgId}/customize`);
    // Also revalidate dashboard routes so the org users see the changes
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/teacher");
    revalidatePath("/student");
    return { success: true, error: false };
  } catch (err: any) {
    console.error("Update org metadata error:", err);
    return { success: false, error: true, messages: [err.message || "Failed to update"] };
  }
}
