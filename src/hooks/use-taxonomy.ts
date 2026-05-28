'use client';

import { useOrganization } from '@clerk/nextjs';
import type { InstitutionType } from '@/types/organization';

/**
 * Taxonomy labels that adapt to the institution type.
 * Grade is only relevant for PRIMARY_SCHOOL and SECONDARY_SCHOOL.
 */
export interface TaxonomyMap {
  teacher: string;
  student: string;
  class: string;
  subject: string;
  term: string;
  grade: string | null;
}

const taxonomyDictionary: Record<InstitutionType, TaxonomyMap> = {
  SECONDARY_SCHOOL: {
    teacher: 'Teacher',
    student: 'Student',
    class: 'Class',
    subject: 'Subject',
    term: 'Term',
    grade: 'Grade',
  },
  UNIVERSITY_DEPARTMENT: {
    teacher: 'Lecturer',
    student: 'Student',
    class: 'Level',
    subject: 'Course',
    term: 'Semester',
    grade: null, // not applicable
  },
  PRIMARY_SCHOOL: {
    teacher: 'Teacher',
    student: 'Pupil',
    class: 'Class',
    subject: 'Subject',
    term: 'Term',
    grade: 'Grade',
  },
  TRAINING_CENTER: {
    teacher: 'Instructor',
    student: 'Trainee',
    class: 'Cohort',
    subject: 'Module',
    term: 'Session',
    grade: null, // not applicable
  },
};

const fallbackTaxonomy: TaxonomyMap = {
  teacher: 'Teacher',
  student: 'Student',
  class: 'Class',
  subject: 'Subject',
  term: 'Term',
  grade: null,
};

/**
 * Returns institution-specific taxonomy labels.
 *
 * Reads `institutionType` from the current Clerk Organization's
 * `publicMetadata` and maps it to the correct display names.
 *
 * Must be used in Client Components only.
 *
 * @example
 * const t = useTaxonomy();
 * <span>{t.teacher}s</span>  // → "Lecturers" for university
 */
export function useTaxonomy(): TaxonomyMap {
  const { organization } = useOrganization();
  const institutionType = (
    organization?.publicMetadata as { institutionType?: InstitutionType } | undefined
  )?.institutionType;

  if (institutionType && taxonomyDictionary[institutionType]) {
    return taxonomyDictionary[institutionType];
  }

  return fallbackTaxonomy;
}

/**
 * Pure function variant for Server Components / Server Actions.
 * Pass the institutionType directly instead of reading from a hook.
 */
export function getTaxonomy(institutionType?: InstitutionType): TaxonomyMap {
  if (institutionType && taxonomyDictionary[institutionType]) {
    return taxonomyDictionary[institutionType];
  }
  return fallbackTaxonomy;
}
