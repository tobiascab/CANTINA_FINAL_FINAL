const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('--- DIAGNOSTIC START ---');

exec('wmic printer get name', (err, stdout) => {
    if (err) {
        console.error('Error listing printers:', err);
    } else {
        console.log('INSTALLED PRINTERS:');
        console.log(stdout);
    }
});

const configPath = path.join(__dirname, 'printer-config.json');
if (fs.existsSync(configPath)) {
    console.log('PRINTER CONFIG:', fs.readFileSync(configPath, 'utf8'));
} else {
    console.log('PRINTER CONFIG NOT FOUND');
}
