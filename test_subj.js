const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.subject.findMany({ orderBy: { id: "desc" }, take: 10 });
  console.log("Recent Subjects:");
  console.log(s);
}
main().catch(console.error).finally(() => prisma.$disconnect());
