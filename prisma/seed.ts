import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ADMIN
  await prisma.admin.upsert({ where: { id: "admin1" }, update: {}, create: { id: "admin1", username: "admin1" } });
  await prisma.admin.upsert({ where: { id: "admin2" }, update: {}, create: { id: "admin2", username: "admin2" } });

  // GRADE — always seed levels (100L–500L). id=1 is relied on by ClassForm.
  const levels = [100, 200, 300, 400, 500];
  for (const level of levels) {
    await prisma.grade.upsert({
      where: { level },
      update: {},
      create: { level },
    });
  }

  // CLASS — one per grade (e.g. "100L", "200L", etc.)
  const gradeRecords = await prisma.grade.findMany({ orderBy: { level: "asc" } });
  for (const grade of gradeRecords) {
    const name = `${grade.level}L`;
    await prisma.class.upsert({
      where: { name },
      update: {},
      create: { name, gradeId: grade.id },
    });
  }

  // SUBJECT
  const subjectNames = [
    "Mathematics", "Science", "English", "History", "Geography",
    "Physics", "Chemistry", "Biology", "Computer Science", "Art",
  ];
  for (const name of subjectNames) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  }

  // TEACHER — fetch real class/subject IDs dynamically
  const classRecords = await prisma.class.findMany({ orderBy: { id: "asc" } });
  const subjectRecords = await prisma.subject.findMany({ orderBy: { id: "asc" } });

  for (let i = 1; i <= 15; i++) {
    const classId = classRecords[(i % classRecords.length)]?.id;
    const subjectId = subjectRecords[(i % subjectRecords.length)]?.id;
    await prisma.teacher.upsert({
      where: { id: `teacher${i}` },
      update: {},
      create: {
        id: `teacher${i}`,
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        ...(subjectId ? { subjects: { connect: [{ id: subjectId }] } } : {}),
        ...(classId ? { classes: { connect: [{ id: classId }] } } : {}),
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

  // LESSON
  const teacherRecords = await prisma.teacher.findMany({ orderBy: { id: "asc" } });
  for (let i = 1; i <= 30; i++) {
    const existing = await prisma.lesson.findFirst({ where: { name: `Lesson${i}` } });
    if (!existing) {
      const cId = classRecords[(i % classRecords.length)]?.id;
      const sId = subjectRecords[(i % subjectRecords.length)]?.id;
      const tId = teacherRecords[(i % teacherRecords.length)]?.id;
      if (!cId || !sId || !tId) continue;
      await prisma.lesson.create({
        data: {
          name: `Lesson${i}`,
          day: Day[Object.keys(Day)[Math.floor(Math.random() * Object.keys(Day).length)] as keyof typeof Day],
          startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
          endTime: new Date(new Date().setHours(new Date().getHours() + 3)),
          subjectId: sId,
          classId: cId,
          teacherId: tId,
        },
      });
    }
  }

  // STUDENT
  const firstGrade = gradeRecords[0];
  const firstClass = classRecords[0];
  for (let i = 1; i <= 50; i++) {
    const gId = gradeRecords[(i % gradeRecords.length)]?.id ?? firstGrade?.id;
    const cId = classRecords[(i % classRecords.length)]?.id ?? firstClass?.id;
    await prisma.student.upsert({
      where: { id: `student${i}` },
      update: {},
      create: {
        id: `student${i}`,
        username: `student${i}`,
        name: `SName${i}`,
        surname: `SSurname${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        gradeId: gId,
        classId: cId,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.assignment.findFirst({ where: { title: `Assignment ${i}` } });
    if (!existing) {
      await prisma.assignment.create({
        data: {
          title: `Assignment ${i}`,
          startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
          subjectId: (i % 10) + 1,
        },
      });
    }
  }

  // ATTENDANCE
  const lessonRecords = await prisma.lesson.findMany({ orderBy: { id: "asc" } });
  const studentRecords = await prisma.student.findMany({ orderBy: { id: "asc" } });
  for (let i = 0; i < Math.min(10, lessonRecords.length, studentRecords.length); i++) {
    const lessonId = lessonRecords[i]?.id;
    const studentId = studentRecords[i]?.id;
    if (!lessonId || !studentId) continue;
    const existing = await prisma.attendance.findFirst({ where: { studentId, lessonId } });
    if (!existing) {
      await prisma.attendance.create({
        data: { date: new Date(), present: true, studentId, lessonId },
      });
    }
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    const classId = classRecords[(i % classRecords.length)]?.id;
    const existing = await prisma.announcement.findFirst({ where: { title: `Announcement ${i}` } });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: `Announcement ${i}`,
          description: `Description for Announcement ${i}`,
          date: new Date(),
          ...(classId ? { classId } : {}),
        },
      });
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
