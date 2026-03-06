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
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const componentsDir = 'src/components';
const components = walk(componentsDir);

components.forEach(f => {
    try {
        let text = fs.readFileSync(f, 'utf8');
        let modified = false;

        // Strip static prisma imports
        if (text.includes('import prisma from "@/lib/prisma";') || text.includes('import prisma from "../lib/prisma";')) {
            text = text.replace('import prisma from "@/lib/prisma";\r\n', '');
            text = text.replace('import prisma from "@/lib/prisma";\n', '');
            text = text.replace('import prisma from "@/lib/prisma";', '');

            // Regex to inject lazy load into the main async component function
            const match = text.match(/const\s+(\w+)\s*=\s*async\s*\([^)]*\)\s*=>\s*\{/);
            if (match && !text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
                const insertPos = match.index + match[0].length;
                text = text.slice(0, insertPos) + '\n  const { default: prisma } = await import("@/lib/prisma");' + text.slice(insertPos);
                modified = true;
            } else {
                const matchDefault = text.match(/export default async function \w+\([^)]*\)\s*\{/);
                if (matchDefault && !text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
                    const insertPos = matchDefault.index + matchDefault[0].length;
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
