/**
 * Default seed data for TRAINING_CENTER organisations.
 *
 * Cohort levels (1-4) map to Grade; named cohort groups map to Class.
 * Module names map to Subject.
 * Session-based scheduling (not terms/semesters).
 */
export const trainingCenterTemplate = {
  grades: [
    { level: 1 }, // Cohort 1
    { level: 2 }, // Cohort 2
    { level: 3 }, // Cohort 3
    { level: 4 }, // Cohort 4
  ],
  classes: [
    { name: "Cohort A", gradeLevel: 1 },
    { name: "Cohort B", gradeLevel: 2 },
    { name: "Cohort C", gradeLevel: 3 },
    { name: "Cohort D", gradeLevel: 4 },
  ],
  subjects: [
    // Foundation Modules
    "Introduction to the Programme",
    "Communication Skills",
    "Digital Literacy",
    "Problem Solving and Critical Thinking",
    // Core Technical Modules
    "Core Technical Module I",
    "Core Technical Module II",
    "Core Technical Module III",
    "Practical Workshop I",
    "Practical Workshop II",
    // Professional Development
    "Workplace Ethics and Safety",
    "Project Management Fundamentals",
    "Teamwork and Collaboration",
    // Assessment & Capstone
    "Mid-Programme Assessment",
    "Capstone Project",
    "Certification Preparation",
  ],
  schoolConfig: [
    { key: "sessionNames",    value: JSON.stringify(["Session 1", "Session 2", "Session 3"]) },
    { key: "currentSession", value: "Session 1" },
    { key: "gradingScale",   value: "PERCENTAGE" },
  ],
} as const;

export type TrainingCenterTemplate = typeof trainingCenterTemplate;
