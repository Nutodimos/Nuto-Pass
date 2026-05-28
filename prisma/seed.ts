import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ── 1. Create test Organisation ──────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "unilorin-cpe" },
    update: {},
    create: {
      name: "University of Ilorin — CPE",
      slug: "unilorin-cpe",
    },
  });
  console.log(`✅ Organization: ${org.name} (${org.id})`);

  // ── 2. Create Super Admin user ───────────────────────────────
  const superAdminClerkId = process.env.SUPER_ADMIN_CLERK_ID;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (superAdminClerkId && superAdminEmail) {
    await prisma.user.upsert({
      where: { clerkId: superAdminClerkId },
      update: {},
      create: {
        clerkId: superAdminClerkId,
        email: superAdminEmail,
        role: "SUPER_ADMIN",
        organizationId: null,
      },
    });
    console.log(`✅ Super Admin: ${superAdminEmail}`);
  } else {
    console.log("⚠️  Skipping Super Admin (set SUPER_ADMIN_CLERK_ID and SUPER_ADMIN_EMAIL env vars)");
  }

  // ── 3. Create test Admin for the org ─────────────────────────
  await prisma.user.upsert({
    where: { clerkId: "clerk_test_admin_id" },
    update: {},
    create: {
      clerkId: "clerk_test_admin_id",
      email: "admin@unilorin-cpe.edu.ng",
      name: "Test Admin",
      role: "ADMIN",
      organizationId: org.id,
    },
  });
  console.log("✅ Test Admin created");

  // ── 4. GRADE — always seed levels (100L–500L) ───────────────
  const levels = [100, 200, 300, 400, 500];
  for (const level of levels) {
    await prisma.grade.upsert({
      where: { organizationId_level: { organizationId: org.id, level } },
      update: {},
      create: { level, organizationId: org.id },
    });
  }

  // ── 5. CLASS — one per grade ─────────────────────────────────
  const gradeRecords = await prisma.grade.findMany({
    where: { organizationId: org.id },
    orderBy: { level: "asc" },
  });
  for (const grade of gradeRecords) {
    const name = `${grade.level}L`;
    await prisma.class.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { name, gradeId: grade.id, organizationId: org.id },
    });
  }

  // ── 6. SUBJECT ───────────────────────────────────────────────
  const subjectNames = [
    "Mathematics", "Science", "English", "History", "Geography",
    "Physics", "Chemistry", "Biology", "Computer Science", "Art",
  ];
  for (const name of subjectNames) {
    await prisma.subject.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { name, organizationId: org.id },
    });
  }

  // ── 7. TEACHER ───────────────────────────────────────────────
  const classRecords = await prisma.class.findMany({
    where: { organizationId: org.id },
    orderBy: { id: "asc" },
  });
  const subjectRecords = await prisma.subject.findMany({
    where: { organizationId: org.id },
    orderBy: { id: "asc" },
  });

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
        organizationId: org.id,
      },
    });
  }

  // ── 8. LESSON ────────────────────────────────────────────────
  const teacherRecords = await prisma.teacher.findMany({
    where: { organizationId: org.id },
    orderBy: { id: "asc" },
  });
  for (let i = 1; i <= 30; i++) {
    const existing = await prisma.lesson.findFirst({ where: { name: `Lesson${i}`, organizationId: org.id } });
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
          organizationId: org.id,
        },
      });
    }
  }

  // ── 9. STUDENT ───────────────────────────────────────────────
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
        organizationId: org.id,
      },
    });
  }

  // ── 10. ASSIGNMENT ───────────────────────────────────────────
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.assignment.findFirst({ where: { title: `Assignment ${i}`, organizationId: org.id } });
    if (!existing) {
      const sId = subjectRecords[(i % subjectRecords.length)]?.id;
      if (!sId) continue;
      await prisma.assignment.create({
        data: {
          title: `Assignment ${i}`,
          startDate: new Date(new Date().setHours(new Date().getHours() + 1)),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
          subjectId: sId,
          organizationId: org.id,
        },
      });
    }
  }

  // ── 11. ATTENDANCE ───────────────────────────────────────────
  const lessonRecords = await prisma.lesson.findMany({
    where: { organizationId: org.id },
    orderBy: { id: "asc" },
  });
  const studentRecords = await prisma.student.findMany({
    where: { organizationId: org.id },
    orderBy: { id: "asc" },
  });
  for (let i = 0; i < Math.min(10, lessonRecords.length, studentRecords.length); i++) {
    const lessonId = lessonRecords[i]?.id;
    const studentId = studentRecords[i]?.id;
    if (!lessonId || !studentId) continue;
    const existing = await prisma.attendance.findFirst({ where: { studentId, lessonId, organizationId: org.id } });
    if (!existing) {
      await prisma.attendance.create({
        data: { date: new Date(), present: true, studentId, lessonId, organizationId: org.id },
      });
    }
  }

  // ── 12. ANNOUNCEMENT ─────────────────────────────────────────
  for (let i = 1; i <= 5; i++) {
    const classId = classRecords[(i % classRecords.length)]?.id;
    const existing = await prisma.announcement.findFirst({ where: { title: `Announcement ${i}`, organizationId: org.id } });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: `Announcement ${i}`,
          description: `Description for Announcement ${i}`,
          date: new Date(),
          ...(classId ? { classId } : {}),
          organizationId: org.id,
        },
      });
    }
  }

  console.log("✅ Seeding completed successfully.");
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
