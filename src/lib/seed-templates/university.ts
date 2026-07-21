/**
 * Default seed data for UNIVERSITY_DEPARTMENT organisations.
 *
 * Uses 100/200/300/400/500 levels (Grade.level).
 * "Level" maps to Class in the schema; "Course" maps to Subject.
 * Grading scale defaults to GPA 5.0 (common in Nigerian universities).
 */
export const universityTemplate = {
  grades: [
    { level: 100 },
    { level: 200 },
    { level: 300 },
    { level: 400 },
    { level: 500 },
  ],
  classes: [
    { name: "100 Level", gradeLevel: 100 },
    { name: "200 Level", gradeLevel: 200 },
    { name: "300 Level", gradeLevel: 300 },
    { name: "400 Level", gradeLevel: 400 },
    { name: "500 Level", gradeLevel: 500 },
  ],
  subjects: [
    // 100 Level — Foundation
    "Use of English",
    "Mathematical Methods I",
    "Introduction to Computing",
    "Engineering Drawing",
    "Introduction to Physics",
    "Introduction to Chemistry",
    // 200 Level — Core
    "Electric Circuit Theory",
    "Digital Electronics",
    "Mathematical Methods II",
    "Engineering Mathematics",
    "Data Structures and Algorithms",
    "Computer Organisation and Architecture",
    // 300 Level — Intermediate
    "Operating Systems",
    "Computer Networks",
    "Database Management Systems",
    "Software Engineering",
    "Signals and Systems",
    "Microprocessors and Embedded Systems",
    // 400 Level — Advanced
    "Artificial Intelligence",
    "Machine Learning",
    "Wireless Communications",
    "VLSI Design",
    "Final Year Project I",
    "Industrial Training",
    // 500 Level — Postgraduate / 5-year programmes
    "Advanced Networking",
    "Cybersecurity",
    "Cloud Computing",
    "Research Methods",
    "Final Year Project II",
  ],
  schoolConfig: [
    { key: "semesterNames",    value: JSON.stringify(["First Semester", "Second Semester"]) },
    { key: "currentSemester", value: "First Semester" },
    { key: "gradingScale",    value: "GPA_5_0" },
  ],
} as const;

export type UniversityTemplate = typeof universityTemplate;
