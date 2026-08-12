import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rawData = {
  "300L": {
    "harmattan": [
      { "code": "CPE 311", "title": "Electric Circuit Theory", "status": "C", "credits": 3 },
      { "code": "CPE 321", "title": "Analogue Electronics Circuits", "status": "C", "credits": 3 },
      { "code": "CPE 331", "title": "Electromagnetic Fields & Waves", "status": "C", "credits": 3 },
      { "code": "CPE 341", "title": "Software Development Techniques", "status": "C", "credits": 3 },
      { "code": "CPE 381", "title": "Laboratory Course I", "status": "C", "credits": 1 },
      { "code": "GNS 311", "title": "History and Philosophy of Science", "status": "R", "credits": 2 },
      { "code": "GSE 301", "title": "Entrepreneurial Skill", "status": "R", "credits": 2 },
      { "code": "MEE 361", "title": "Engineering Mathematics III", "status": "R", "credits": 3 }
    ],
    "harmattan_total": 20,
    "rain": [
      { "code": "ABE 306", "title": "Engineering Economics", "status": "R", "credits": 2 },
      { "code": "ABE 376", "title": "Engineering Communication", "status": "R", "credits": 1 },
      { "code": "CPE 312", "title": "Measurement & Instrumentation", "status": "C", "credits": 2 },
      { "code": "CPE 336", "title": "Digital Electronics", "status": "C", "credits": 3 },
      { "code": "CPE 342", "title": "Software Engineering", "status": "C", "credits": 3 },
      { "code": "CPE 372", "title": "Data Communication & Networks", "status": "C", "credits": 3 },
      { "code": "CPE 382", "title": "Laboratory Course & Mini-Project", "status": "C", "credits": 2 },
      { "code": "MEE 362", "title": "Engineering Mathematics IV", "status": "R", "credits": 3 }
    ],
    "rain_total": 19,
    "third_semester_long_vacation": [
      { "code": "CPE 392", "title": "Industrial Training I (SIWES)", "status": "C", "credits": 6 }
    ],
    "third_semester_total": 6
  },

  "400L": {
    "harmattan": [
      { "code": "CPE 423", "title": "Introduction to Digital System Design with VHDL", "status": "C", "credits": 2 },
      { "code": "CPE 435", "title": "Prototyping Techniques & Packaging", "status": "C", "credits": 2 },
      { "code": "CPE 437", "title": "Artificial Intelligence and Applications", "status": "C", "credits": 2 },
      { "code": "CPE 443", "title": "Assembly Language Programming", "status": "C", "credits": 2 },
      { "code": "CPE 441", "title": "Control Theory I", "status": "C", "credits": 3 },
      { "code": "CPE 451", "title": "Communication Principles", "status": "C", "credits": 2 },
      { "code": "ABE 463", "title": "Engineering Statistics", "status": "R", "credits": 2 },
      { "code": "CPE 471", "title": "Microprocessor System and Interfacing", "status": "C", "credits": 3 },
      { "code": "CPE 481", "title": "Laboratory Course III", "status": "C", "credits": 2 }
    ],
    "harmattan_total": 20,
    "rain": [
      { "code": "CPE 492", "title": "Industrial Training II (SIWES)", "status": "C", "credits": 12 }
    ],
    "rain_total": 12
  },

  "500L": {
    "harmattan_common": [
      { "code": "ABE 573", "title": "Engineer in Society", "status": "R", "credits": 1 },
      { "code": "CPE 501", "title": "Design & Installation of Electrical & ICT Services", "status": "C", "credits": 2 },
      { "code": "CPE 531", "title": "Digital Signal Processing", "status": "C", "credits": 3 },
      { "code": "CPE 541", "title": "Control Theory II", "status": "C", "credits": 2 },
      { "code": "CPE 543", "title": "Technopreneurship & Cyberlaw", "status": "C", "credits": 2 },
      { "code": "CPE 561", "title": "Computer Organisation & Architecture", "status": "C", "credits": 2 },
      { "code": "CPE 593", "title": "Project I", "status": "C", "credits": 4 },
      { "code": "ABE 501", "title": "Engineering Management", "status": "R", "credits": 3 }
    ],
    "harmattan_common_total": 19,
    "harmattan_electives": {
      "embedded_systems_and_automation": [
        { "code": "CPE 547", "title": "Power Electronics", "status": "E", "credits": 2 },
        { "code": "CPE 545", "title": "Control Theory III", "status": "E", "credits": 2 }
      ],
      "computer_hardware_and_software_systems": [
        { "code": "CPE 551", "title": "Parallel Processing", "status": "E", "credits": 2 },
        { "code": "CPE 553", "title": "Digital Image Processing", "status": "E", "credits": 2 },
        { "code": "CPE 557", "title": "Digital Speech Processing", "status": "E", "credits": 2, "note": "choose at least 2 of the 3 in this option" }
      ]
    },
    "rain_common": [
      { "code": "BUL 506", "title": "Engineering Law", "status": "R", "credits": 3 },
      { "code": "CPE 502", "title": "Reliability & Maintainability of Computer System", "status": "C", "credits": 2 },
      { "code": "CPE 532", "title": "Computer Security Techniques", "status": "C", "credits": 2 },
      { "code": "CPE 546", "title": "Embedded System Design & Programming", "status": "C", "credits": 2 },
      { "code": "CPE 594", "title": "Project II", "status": "C", "credits": 4 },
      { "code": "MME 524", "title": "Materials Selection and Economics", "status": "R", "credits": 3 }
    ],
    "rain_common_total": 16,
    "rain_electives": {
      "embedded_systems_and_automation": [
        { "code": "CPE 544", "title": "Introduction to Robotics & Automation", "status": "E", "credits": 2 },
        { "code": "CPE 548", "title": "Fuzzy Logic and Programming", "status": "E", "credits": 2 }
      ],
      "computer_hardware_and_software_systems": [
        { "code": "CPE 552", "title": "Advanced Digital Design", "status": "E", "credits": 2 },
        { "code": "CPE 554", "title": "Cryptography Principles and Applications", "status": "E", "credits": 2 },
        { "code": "CPE 556", "title": "Multimedia Technology & Programming", "status": "E", "credits": 2 }
      ]
    }
  },

  "options": [
    "Embedded Systems and Automation",
    "Computer Hardware and Software Systems"
  ],

  "status_legend": {
    "C": "Compulsory",
    "R": "Required",
    "E": "Elective"
  }
};

interface CourseItem {
  code: string;
  title: string;
  status: string;
  credits: number;
  note?: string;
}

async function seedCPETenant() {
  console.log("🌱 Finding CPE Automation organization...");
  
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: "unilorin-cpe" },
        { name: { contains: "CPE", mode: "insensitive" } },
      ],
    },
  });

  if (!org) {
    throw new Error("Could not find CPE Automation organization in database.");
  }

  console.log(`✅ Target Organization: ${org.name} (${org.id})`);

  const coursesToSeed: Array<{
    code: string;
    title: string;
    credits: number;
    level: number;
    semester: number; // 1 = Harmattan, 2 = Rain, 3 = Third Semester (Vacation)
    status: string;
  }> = [];

  // Helper function to insert
  const addCourses = (items: CourseItem[], level: number, semester: number) => {
    for (const item of items) {
      coursesToSeed.push({
        code: item.code.trim(),
        title: item.title.trim(),
        credits: item.credits,
        level,
        semester,
        status: item.status,
      });
    }
  };

  // --- 300L ---
  addCourses(rawData["300L"].harmattan, 300, 1);
  addCourses(rawData["300L"].rain, 300, 2);
  addCourses(rawData["300L"].third_semester_long_vacation, 300, 3);

  // --- 400L ---
  addCourses(rawData["400L"].harmattan, 400, 1);
  addCourses(rawData["400L"].rain, 400, 2);

  // --- 500L Common ---
  addCourses(rawData["500L"].harmattan_common, 500, 1);
  addCourses(rawData["500L"].rain_common, 500, 2);

  // --- 500L Electives ---
  const hElectives = rawData["500L"].harmattan_electives;
  addCourses(hElectives.embedded_systems_and_automation, 500, 1);
  addCourses(hElectives.computer_hardware_and_software_systems, 500, 1);

  const rElectives = rawData["500L"].rain_electives;
  addCourses(rElectives.embedded_systems_and_automation, 500, 2);
  addCourses(rElectives.computer_hardware_and_software_systems, 500, 2);

  console.log(`🔄 Seeding ${coursesToSeed.length} courses to ${org.name}...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const course of coursesToSeed) {
    const existing = await prisma.subject.findUnique({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: course.code,
        },
      },
    });

    if (existing) {
      await prisma.subject.update({
        where: { id: existing.id },
        data: {
          title: course.title,
          credits: course.credits,
          level: course.level,
          semester: course.semester,
          status: course.status,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      await prisma.subject.create({
        data: {
          name: course.code,
          title: course.title,
          credits: course.credits,
          level: course.level,
          semester: course.semester,
          status: course.status,
          isActive: true,
          organizationId: org.id,
        },
      });
      createdCount++;
    }
  }

  // Also save complete JSON into SchoolConfig table for the tenant
  await prisma.schoolConfig.upsert({
    where: {
      organizationId_key: {
        organizationId: org.id,
        key: "cpe_curriculum",
      },
    },
    update: {
      value: JSON.stringify(rawData),
    },
    create: {
      organizationId: org.id,
      key: "cpe_curriculum",
      value: JSON.stringify(rawData),
    },
  });

  console.log(`🎉 Seeding complete! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${coursesToSeed.length}`);
}

seedCPETenant()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ Error seeding CPE tenant:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
