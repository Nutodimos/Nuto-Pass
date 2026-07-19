import { Day, PrismaClient, UserSex, InstitutionType } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ── 1. Create test Organisation ──────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "unilorin-cpe" },
    update: {},
    create: {
      id: "cmpmsmg6f0007cod1vjv2l3kn", // Hardcoded to match active Clerk session
      name: "University of Ilorin — CPE",
      slug: "unilorin-cpe",
      institutionType: InstitutionType.UNIVERSITY_DEPARTMENT,
      metadata: {
        features: {
          hasHostels: false,
          hasResults: true,
          gradingScale: "GPA_5_0",
          hasMaterials: true,
          hasBiometrics: true,
          hasAssignments: true
        },
        uiConfig: {
          navItems: [],
          accentColor: "#B99146",
          primaryColor: "#0A1E4B",
          logoUrl: "/cpeautomation-logo.png",
          sidebarTitle: "CPE Automation"
        }
      }
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

  // ── 4. GRADE (Levels: 100L - 500L) ──────────────────────────
  const levels = [100, 200, 300, 400, 500];
  const gradeRecords = [];
  for (const level of levels) {
    const grade = await prisma.grade.upsert({
      where: { organizationId_level: { organizationId: org.id, level } },
      update: {},
      create: { level, organizationId: org.id },
    });
    gradeRecords.push(grade);
  }

  // ── 5. CLASS (One per Grade) ─────────────────────────────────
  const classRecords = [];
  for (const grade of gradeRecords) {
    const name = `${grade.level}L`;
    const cls = await prisma.class.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { name, gradeId: grade.id, organizationId: org.id },
    });
    classRecords.push(cls);
  }

  // ── 6. SUBJECT (Courses) ─────────────────────────────────────
  const subjectNames = [
    { name: "CPE 311", title: "Software Engineering", credits: 3 },
    { name: "CPE 312", title: "Data Structures", credits: 3 },
    { name: "CPE 411", title: "Artificial Intelligence", credits: 2 },
    { name: "CPE 412", title: "Digital Signal Processing", credits: 3 },
    { name: "CPE 511", title: "Cybersecurity", credits: 2 },
  ];
  const subjectRecords = [];
  for (const sub of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { organizationId_name: { organizationId: org.id, name: sub.name } },
      update: {},
      create: { 
        name: sub.name, 
        title: sub.title, 
        credits: sub.credits, 
        organizationId: org.id 
      },
    });
    subjectRecords.push(subject);
  }

  // ── 7. TEACHER (Lecturers) ───────────────────────────────────
  const teacherRecords = [];
  for (let i = 1; i <= 5; i++) {
    const classId = classRecords[(i % classRecords.length)]?.id;
    const subjectId = subjectRecords[(i % subjectRecords.length)]?.id;
    const teacher = await prisma.teacher.upsert({
      where: { id: `teacher${i}` },
      update: {},
      create: {
        id: `teacher${i}`,
        username: `lecturer${i}`,
        name: `Dr. Lecturer`,
        surname: `${i}`,
        email: `lecturer${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `CPE Block, Office ${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        ...(subjectId ? { subjects: { connect: [{ id: subjectId }] } } : {}),
        ...(classId ? { classes: { connect: [{ id: classId }] } } : {}),
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 40)),
        organizationId: org.id,
      },
    });
    teacherRecords.push(teacher);
  }

  // ── 8. LESSON (Timetable) ────────────────────────────────────
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.lesson.findFirst({ where: { name: `Lec-${i}`, organizationId: org.id } });
    if (!existing) {
      const cId = classRecords[(i % classRecords.length)]?.id;
      const sId = subjectRecords[(i % subjectRecords.length)]?.id;
      const tId = teacherRecords[(i % teacherRecords.length)]?.id;
      if (!cId || !sId || !tId) continue;
      
      const dayKeys = Object.keys(Day) as (keyof typeof Day)[];
      const randomDay = Day[dayKeys[Math.floor(Math.random() * dayKeys.length)]];
      
      await prisma.lesson.create({
        data: {
          name: `Lec-${i}`,
          day: randomDay,
          startTime: new Date(new Date().setHours(8 + (i % 6), 0, 0, 0)),
          endTime: new Date(new Date().setHours(10 + (i % 6), 0, 0, 0)),
          subjectId: sId,
          classId: cId,
          teacherId: tId,
          organizationId: org.id,
        },
      });
    }
  }

  // ── 9. STUDENT ───────────────────────────────────────────────
  const studentRecords = [];
  for (let i = 1; i <= 20; i++) {
    const gId = gradeRecords[(i % gradeRecords.length)]?.id;
    const cId = classRecords[(i % classRecords.length)]?.id;
    if (!gId || !cId) continue;

    const student = await prisma.student.upsert({
      where: { id: `student${i}` },
      update: {},
      create: {
        id: `student${i}`,
        username: `student${i}`,
        name: `Student`,
        surname: `${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Hostel Block ${i}`,
        bloodType: "O+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        gradeId: gId,
        classId: cId,
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
        organizationId: org.id,
      },
    });
    studentRecords.push(student);
  }

  // ── 10. ASSIGNMENT & MATERIAL ───────────────────────────────
  for (let i = 1; i <= 5; i++) {
    const sId = subjectRecords[(i % subjectRecords.length)]?.id;
    if (!sId) continue;
    
    // Assignment
    const existingAssignment = await prisma.assignment.findFirst({ where: { title: `Lab Report ${i}`, organizationId: org.id } });
    if (!existingAssignment) {
      await prisma.assignment.create({
        data: {
          title: `Lab Report ${i}`,
          description: `Submit the lab report for experiment ${i}`,
          startDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
          subjectId: sId,
          organizationId: org.id,
        },
      });
    }

    // Material
    const existingMaterial = await prisma.material.findFirst({ where: { title: `Lecture Slide ${i}`, organizationId: org.id } });
    if (!existingMaterial) {
      await prisma.material.create({
        data: {
          title: `Lecture Slide ${i}`,
          filePath: `/uploads/materials/slide_${i}.pdf`,
          isGeneral: true,
          subjectId: sId,
          organizationId: org.id,
        },
      });
    }
  }

  // ── 11. ANNOUNCEMENT ─────────────────────────────────────────
  for (let i = 1; i <= 3; i++) {
    const existing = await prisma.announcement.findFirst({ where: { title: `Important Notice ${i}`, organizationId: org.id } });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: `Important Notice ${i}`,
          description: `This is a public announcement regarding the upcoming exams.`,
          date: new Date(),
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
