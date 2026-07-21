/**
 * Default seed data for SECONDARY_SCHOOL organisations.
 *
 * grades  – unique numeric levels (drives Grade.level in DB).
 * classes – each entry maps to a Class row; gradeLevel ties it to a Grade.
 * subjects – each entry maps to a Subject row (name only; admins fill the rest).
 * schoolConfig – key/value entries written to SchoolConfig.
 */
export const secondarySchoolTemplate = {
  grades: [
    { level: 1 }, // JSS1
    { level: 2 }, // JSS2
    { level: 3 }, // JSS3
    { level: 4 }, // SS1
    { level: 5 }, // SS2
    { level: 6 }, // SS3
  ],
  classes: [
    { name: "JSS1", gradeLevel: 1 },
    { name: "JSS2", gradeLevel: 2 },
    { name: "JSS3", gradeLevel: 3 },
    { name: "SS1",  gradeLevel: 4 },
    { name: "SS2",  gradeLevel: 5 },
    { name: "SS3",  gradeLevel: 6 },
  ],
  subjects: [
    "English Language",
    "Mathematics",
    "Civic Education",
    "Biology",
    "Chemistry",
    "Physics",
    "Further Mathematics",
    "Agricultural Science",
    "Geography",
    "Economics",
    "Government",
    "Literature in English",
    "Christian Religious Studies",
    "Islamic Religious Studies",
    "History",
    "Computer Studies",
    "Financial Accounting",
    "Commerce",
    "French",
    "Physical and Health Education",
  ],
  schoolConfig: [
    { key: "termNames",    value: JSON.stringify(["First Term", "Second Term", "Third Term"]) },
    { key: "currentTerm", value: "First Term" },
    { key: "gradingScale", value: "PERCENTAGE" },
  ],
} as const;

export type SecondarySchoolTemplate = typeof secondarySchoolTemplate;
