import { InstitutionType } from "@prisma/client";
import { secondarySchoolTemplate, type SecondarySchoolTemplate } from "./secondary-school";
import { primarySchoolTemplate, type PrimarySchoolTemplate } from "./primary-school";
import { universityTemplate, type UniversityTemplate } from "./university";
import { trainingCenterTemplate, type TrainingCenterTemplate } from "./training-center";

/**
 * The shared shape that every seed template must satisfy.
 *
 * - grades:       Grade levels to create (Grade.level is a unique Int per org).
 * - classes:      Class rows; each references a grade by its numeric level.
 * - subjects:     Subject names (admins fill credits/level/semester post-creation).
 * - schoolConfig: Key/value pairs written to SchoolConfig.
 */
export interface SeedTemplate {
  grades: ReadonlyArray<{ level: number }>;
  classes: ReadonlyArray<{ name: string; gradeLevel: number }>;
  subjects: ReadonlyArray<string>;
  schoolConfig: ReadonlyArray<{ key: string; value: string }>;
}

// Verify at compile-time that every template satisfies SeedTemplate.
const _checkSecondary: SeedTemplate = secondarySchoolTemplate;
const _checkPrimary: SeedTemplate = primarySchoolTemplate;
const _checkUniversity: SeedTemplate = universityTemplate;
const _checkTraining: SeedTemplate = trainingCenterTemplate;
void _checkSecondary, _checkPrimary, _checkUniversity, _checkTraining;

export type TemplateLookup = {
  SECONDARY_SCHOOL: SecondarySchoolTemplate;
  PRIMARY_SCHOOL: PrimarySchoolTemplate;
  UNIVERSITY_DEPARTMENT: UniversityTemplate;
  TRAINING_CENTER: TrainingCenterTemplate;
};

/**
 * Returns the seed template for the given institution type.
 * The return type is narrowed per key via the TemplateLookup map.
 *
 * Throws for unmapped institution types so new enum values are caught at
 * compile-time (exhaustiveness check via the `never` default branch).
 */
export function getSeedTemplate<T extends InstitutionType>(
  institutionType: T,
): TemplateLookup[T] {
  switch (institutionType) {
    case "SECONDARY_SCHOOL":
      return secondarySchoolTemplate as TemplateLookup[T];
    case "PRIMARY_SCHOOL":
      return primarySchoolTemplate as TemplateLookup[T];
    case "UNIVERSITY_DEPARTMENT":
      return universityTemplate as TemplateLookup[T];
    case "TRAINING_CENTER":
      return trainingCenterTemplate as TemplateLookup[T];
    default: {
      // Exhaustiveness guard: if a new InstitutionType is added to the enum
      // without a matching case, TypeScript will flag this as an error.
      const _exhaustive: never = institutionType;
      throw new Error(`No seed template for institution type: ${_exhaustive}`);
    }
  }
}
