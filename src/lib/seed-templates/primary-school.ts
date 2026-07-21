/**
 * Default seed data for PRIMARY_SCHOOL organisations.
 *
 * 6 year-group grades; basic primary subjects; percentage grading.
 */
export const primarySchoolTemplate = {
  grades: [
    { level: 1 }, // Primary 1
    { level: 2 }, // Primary 2
    { level: 3 }, // Primary 3
    { level: 4 }, // Primary 4
    { level: 5 }, // Primary 5
    { level: 6 }, // Primary 6
  ],
  classes: [
    { name: "Primary 1", gradeLevel: 1 },
    { name: "Primary 2", gradeLevel: 2 },
    { name: "Primary 3", gradeLevel: 3 },
    { name: "Primary 4", gradeLevel: 4 },
    { name: "Primary 5", gradeLevel: 5 },
    { name: "Primary 6", gradeLevel: 6 },
  ],
  subjects: [
    "English Language",
    "Mathematics",
    "Basic Science",
    "Social Studies",
    "Civic Education",
    "Christian Religious Studies",
    "Islamic Religious Studies",
    "Yoruba Language",
    "Igbo Language",
    "Hausa Language",
    "Physical and Health Education",
    "Agricultural Science",
    "Computer Studies",
    "Fine Art and Craft",
    "Music",
    "Home Economics",
  ],
  schoolConfig: [
    { key: "termNames",    value: JSON.stringify(["First Term", "Second Term", "Third Term"]) },
    { key: "currentTerm", value: "First Term" },
    { key: "gradingScale", value: "PERCENTAGE" },
  ],
} as const;

export type PrimarySchoolTemplate = typeof primarySchoolTemplate;
