const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const attendances = await prisma.attendance.findMany({
        take: 5,
        orderBy: { id: 'desc' }
    });
    console.log(JSON.stringify(attendances, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
