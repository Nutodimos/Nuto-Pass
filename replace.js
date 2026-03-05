const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
    { search: /nuto-/g, replace: 'cpe-' },
    { search: /nuto/g, replace: 'cpe' },
    { search: /Nuto/g, replace: 'CPE' }
];

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath);
        } else if (file.match(/\.(ts|tsx|css|js|jsx)$/)) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            replacements.forEach(rep => {
                content = content.replace(rep.search, rep.replace);
            });

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated leftovers: ${filePath}`);
            }
        }
    });
}

if (fs.existsSync(directoryPath)) {
    processDirectory(directoryPath);
}
console.log('Leftovers replacement complete.');
