const fs = require('fs');

const files = [
    'src/app/api/attendance/biometric/route.ts',
    'src/app/api/attendance/history/route.ts',
    'src/app/api/attendance/session/route.ts',
    'src/app/api/csv/enroll-students/route.ts',
    'src/app/api/csv/import-students/route.ts',
    'src/app/api/csv/import-timetable/route.ts',
    'src/app/api/files/[...path]/route.ts',
    'src/app/api/search/route.ts',
    'src/app/api/student/biometric/route.ts',
    'src/app/api/upload/route.ts',
    'src/app/api/webhooks/clerk/route.ts'
];

files.forEach(f => {
    try {
        let text = fs.readFileSync(f, 'utf8');

        const searchStr = 'const { default: prisma } = await import("@/lib/prisma");';
        let lines = text.split('\n');
        let newLines = [];
        let lastWasPrisma = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.includes(searchStr)) {
                if (!lastWasPrisma) {
                    newLines.push(line);
                    lastWasPrisma = true;
                }
            } else {
                newLines.push(line);
                if (line.trim() !== '') {
                    lastWasPrisma = false;
                }
            }
        }

        fs.writeFileSync(f, newLines.join('\n'));
        console.log('Deduplicated ' + f);
    } catch (e) {
        console.error('Failed to process ' + f + ': ' + e.message);
    }
});
