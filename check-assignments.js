const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.assignment.count();
    console.log('Total Assignments in Database:', count);

    if (count > 0) {
        const sample = await prisma.assignment.findFirst({
            include: {
                lesson: {
                    include: {
                        subject: true,
                        class: true,
                    }
                }
            }
        });
        console.log('Sample Assignment:');
        console.log(JSON.stringify(sample, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
