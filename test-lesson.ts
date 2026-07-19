import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const org = await prisma.organization.findFirst();
  if (!org) return console.log("No org");
  const subject = await prisma.subject.findFirst();
  const cls = await prisma.class.findFirst();
  const teacher = await prisma.teacher.findFirst();
  try {
    await prisma.lesson.create({
      data: {
        name: "Test - Test",
        day: "SUNDAY",
        startTime: new Date("2026-07-19T15:00:00.000Z"),
        endTime: new Date("2026-07-19T18:00:00.000Z"),
        subjectId: subject!.id,
        classId: cls!.id,
        teacherId: teacher!.id,
        organizationId: org.id
      }
    });
    console.log("Success");
  } catch (err) {
    console.error("Prisma error:", err);
  }
}
run().then(() => prisma.$disconnect());
