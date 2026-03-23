import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up mock data...");

  // Delete dependent records
  await prisma.attendance.deleteMany({
    where: { studentId: { startsWith: "student" } },
  });

  await prisma.assignment.deleteMany({
    where: { title: { startsWith: "Assignment" } },
  });

  await prisma.announcement.deleteMany({
    where: { title: { startsWith: "Announcement" } },
  });

  await prisma.lesson.deleteMany({
    where: { name: { startsWith: "Lesson" } },
  });

  await prisma.courseEnrollment.deleteMany({
    where: { studentId: { startsWith: "student" } },
  });

  // Delete all seeded students
  await prisma.student.deleteMany({
    where: { id: { startsWith: "student" } },
  });

  // Delete all seeded teachers
  await prisma.teacher.deleteMany({
    where: { id: { startsWith: "teacher" } },
  });

  // Delete all seeded classes
  await prisma.class.deleteMany({
    where: {
      name: { in: ["100L", "200L", "300L", "400L", "500L"] },
    },
  });

  // Delete all seeded subjects
  await prisma.subject.deleteMany({
    where: {
      name: { in: ["Mathematics", "Science", "English", "History", "Physics", "Chemistry", "Biology", "Computer Science", "Geography", "Art"] },
    },
  });

  console.log("Mock data cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
