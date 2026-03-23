const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.schoolConfig.findUnique({ where: { key: 'currentSemester' } });
  console.log("Current Semester:", c);
}
main().catch(console.error).finally(() => prisma.$disconnect());
