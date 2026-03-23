import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany({
    orderBy: { id: "desc" },
    take: 5
  });
  console.log("Recent Subjects:", subjects);
}
main().finally(() => prisma.$disconnect());
