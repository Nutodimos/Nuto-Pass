const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('page.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dashboardDir = 'src/app/(dashboard)';
const pages = walk(dashboardDir);

pages.forEach(f => {
    try {
        let text = fs.readFileSync(f, 'utf8');
        let modified = false;

        // 1. Add force-dynamic if missing
        if (!text.includes('export const dynamic = "force-dynamic";')) {
            text = 'export const dynamic = "force-dynamic";\n' + text;
            modified = true;
        }

        // 2. Fix top-level prisma imports
        if (text.includes('import prisma from "@/lib/prisma";')) {
            text = text.replace('import prisma from "@/lib/prisma";\r\n', '');
            text = text.replace('import prisma from "@/lib/prisma";\n', '');
            text = text.replace('import prisma from "@/lib/prisma";', '');

            // Regex to find the async page component function.
            // e.g. "const AnnouncementListPage = async ({", "export default async function Page(" etc.
            // Most pages in this project use: "const SomePage = async ({...}) => {"
            const match = text.match(/const\s+(\w+)\s*=\s*async\s*\(/);
            if (match && !text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
                // Find where the function body starts: "=> {"
                const blockStart = text.indexOf('=> {', match.index);
                if (blockStart !== -1) {
                    const insertPos = blockStart + 4;
                    text = text.slice(0, insertPos) + '\n  const { default: prisma } = await import("@/lib/prisma");' + text.slice(insertPos);
                    modified = true;
                }
            } else if (text.match(/export default async function \w+\(/) && !text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
                const match2 = text.match(/export default async function \w+\([^)]*\)\s*\{/);
                if (match2) {
                    const insertPos = match2.index + match2[0].length;
                    text = text.slice(0, insertPos) + '\n  const { default: prisma } = await import("@/lib/prisma");' + text.slice(insertPos);
                    modified = true;
                }
            }
        }

        if (modified) {
            fs.writeFileSync(f, text);
            console.log('Fixed ' + f);
        }
    } catch (e) {
        console.error('Error on ' + f + ':', e);
    }
});
