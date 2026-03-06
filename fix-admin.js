const fs = require('fs');
const files = [
    'src/components/UserCard.tsx',
    'src/components/AttendanceOverviewCard.tsx',
    'src/components/AttendanceChartContainer.tsx',
    'src/components/RecentActivitiesCard.tsx',
    'src/components/Announcements.tsx'
];

files.forEach(f => {
    try {
        let text = fs.readFileSync(f, 'utf8');
        if (text.includes('import prisma from "@/lib/prisma";')) {
            text = text.replace('import prisma from "@/lib/prisma";\r\n', '');
            text = text.replace('import prisma from "@/lib/prisma";\n', '');

            // Inject into the async function
            const funcDefs = [
                'const UserCard = async ({',
                'const AttendanceOverviewCard = async () => {',
                'const AttendanceChartContainer = async () => {',
                'const RecentActivitiesCard = async () => {',
                'const Announcements = async () => {'
            ];

            for (let def of funcDefs) {
                if (text.includes(def) && !text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
                    text = text.replace(def, def + '\n  const { default: prisma } = await import("@/lib/prisma");\n');
                }
            }
            fs.writeFileSync(f, text);
            console.log('Fixed ' + f);
        } else {
            console.log('Already fixed or no import in ' + f);
        }
    } catch (e) {
        console.error(e);
    }
});
