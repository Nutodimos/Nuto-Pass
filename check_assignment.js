const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const assignment = await prisma.assignment.findMany({
        orderBy: { id: 'desc' },
        take: 1,
    });
    console.log(JSON.stringify(assignment, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
