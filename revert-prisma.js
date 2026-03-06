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
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const targetDirs = ['src/app', 'src/components', 'src/lib', 'src/actions'];
let allFiles = [];
targetDirs.forEach(d => {
    if (fs.existsSync(d)) allFiles = allFiles.concat(walk(d));
});

allFiles.forEach(f => {
    try {
        let text = fs.readFileSync(f, 'utf8');
        let modified = false;

        if (text.includes('const { default: prisma } = await import("@/lib/prisma");')) {
            // Remove the dynamic import
            text = text.replace(/[\n\s]*const \{ default: prisma \} = await import\("@\/lib\/prisma"\);/g, '');

            // Add static import to top if not exists
            if (!text.includes('import prisma from "@/lib/prisma";')) {
                // Find a good place to insert (after 'use client' or 'export const dynamic' or just at the top)
                if (text.startsWith('"use client"')) {
                    text = '"use client";\nimport prisma from "@/lib/prisma";\n' + text.substring(13);
                } else if (text.startsWith("'use client'")) {
                    text = "'use client';\nimport prisma from \"@/lib/prisma\";\n" + text.substring(13);
                } else {
                    const lines = text.split('\n');
                    let insertIdx = 0;
                    if (lines[0].includes('export const dynamic')) {
                        insertIdx = 1;
                    }
                    lines.splice(insertIdx, 0, 'import prisma from "@/lib/prisma";');
                    text = lines.join('\n');
                }
            }
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(f, text);
            console.log('Reverted ' + f);
        }
    } catch (e) {
        console.error('Error on ' + f + ':', e);
    }
});
