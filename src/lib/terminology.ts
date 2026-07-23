import { InstitutionType } from "@prisma/client";

export type Entity = "level" | "class" | "subject";

interface Term {
  singular: string;
  plural: string;
}

const terminologyMap: Record<InstitutionType, Record<Entity, Term>> = {
  UNIVERSITY_DEPARTMENT: {
    level: { singular: "Level", plural: "Levels" },
    class: { singular: "Class", plural: "Classes" },
    subject: { singular: "Course", plural: "Courses" },
  },
  SECONDARY_SCHOOL: {
    level: { singular: "Grade", plural: "Grades" },
    class: { singular: "Class", plural: "Classes" },
    subject: { singular: "Subject", plural: "Subjects" },
  },
  PRIMARY_SCHOOL: {
    level: { singular: "Grade", plural: "Grades" },
    class: { singular: "Class", plural: "Classes" },
    subject: { singular: "Subject", plural: "Subjects" },
  },
  TRAINING_CENTER: {
    level: { singular: "Cohort", plural: "Cohorts" },
    class: { singular: "Group", plural: "Groups" },
    subject: { singular: "Module", plural: "Modules" },
  },
};

export function getTerm(
  institutionType: InstitutionType | undefined,
  entity: Entity,
  options?: { plural?: boolean; capitalize?: boolean }
): string {
  // Default to UNIVERSITY_DEPARTMENT if undefined
  const type = institutionType || "UNIVERSITY_DEPARTMENT";
  const termObj = terminologyMap[type]?.[entity] || terminologyMap.UNIVERSITY_DEPARTMENT[entity];

  let result = options?.plural ? termObj.plural : termObj.singular;

  if (options?.capitalize) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}
