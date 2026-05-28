"use server";

import { getTenantDb } from "./tenant";

export async function getSearchSuggestions(query: string, path: string) {
  if (!query || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();

  try {
    const db = getTenantDb();

    if (path.includes("/list/students")) {
      const results = await db.student.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: lowerQuery, mode: "insensitive" } },
            { surname: { contains: lowerQuery, mode: "insensitive" } },
            { username: { contains: lowerQuery, mode: "insensitive" } },
          ],
        },
        select: { name: true, surname: true, username: true },
        take: 5,
      });
      return results.map(r => ({ label: `${r.name} ${r.surname}`, subLabel: r.username, value: r.username }));
    }

    if (path.includes("/list/lecturers")) {
      const results = await db.teacher.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: lowerQuery, mode: "insensitive" } },
            { surname: { contains: lowerQuery, mode: "insensitive" } },
            { username: { contains: lowerQuery, mode: "insensitive" } },
          ],
        },
        select: { name: true, surname: true, username: true },
        take: 5,
      });
      return results.map(r => ({ label: `${r.name} ${r.surname}`, subLabel: r.username, value: r.username }));
    }

    if (path.includes("/list/courses") || path.includes("/list/subjects")) {
      const results = await db.subject.findMany({
        where: {
          isActive: true,
          name: { contains: lowerQuery, mode: "insensitive" },
        },
        select: { name: true },
        take: 5,
      });
      return results.map(r => ({ label: r.name, value: r.name }));
    }

    if (path.includes("/list/attendance")) {
      // Could be classes or subjects, search both
      const classes = await db.class.findMany({
        where: {
          isActive: true,
          name: { contains: lowerQuery, mode: "insensitive" },
        },
        select: { name: true },
        take: 3,
      });
      const subjects = await db.subject.findMany({
        where: {
          isActive: true,
          name: { contains: lowerQuery, mode: "insensitive" },
        },
        select: { name: true },
        take: 3,
      });
      return [
        ...classes.map(r => ({ label: r.name, subLabel: "Class", value: r.name })),
        ...subjects.map(r => ({ label: r.name, subLabel: "Course", value: r.name }))
      ];
    }

    if (path.includes("/list/assignments")) {
      const results = await db.assignment.findMany({
        where: {
          OR: [
            { title: { contains: lowerQuery, mode: "insensitive" } },
            { subject: { name: { contains: lowerQuery, mode: "insensitive" } } },
          ],
        },
        include: { subject: { select: { name: true } } },
        take: 5,
      });
      return results.map(r => ({ label: r.title, subLabel: r.subject.name, value: r.title }));
    }

    return [];
  } catch (error) {
    console.error("Search suggestion error:", error);
    return [];
  }
}
