const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const run = async () => {
    const mysqlPath = 'C:\\xampp\\mysql\\bin\\mysql.exe';
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        port: process.env.DB_PORT || 3307,
        db: process.env.DB_NAME || 'cantina_reducto'
    };

    console.log(`Restoring to ${config.db} on port ${config.port}...`);

    const args = [
        '-u', config.user,
        `-P${config.port}`,
        config.db
    ];

    if (config.password) {
        args.push(`-p${config.password}`);
    }

    const child = spawn(mysqlPath, args);

    child.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    child.stderr.on('data', (data) => console.error(`stderr: ${data}`));
    child.on('close', (code) => console.log(`Restore process exited with code ${code}`));

    const sqlPath = path.join(__dirname, '../database_backup.sql');

    try {
        // Read as UTF-16LE
        let content = fs.readFileSync(sqlPath, 'utf16le');
        // Convert to UTF-8 buffer? 
        // Actually, just writing the string to stdin (node handles encoding to UTF-8 by default)

        // Basic check if it looks like SQL
        if (!content.includes('INSERT') && !content.includes('CREATE')) {
            console.log("UTF-16LE read suspicious, trying UTF-8");
            content = fs.readFileSync(sqlPath, 'utf8');
        }

        child.stdin.write(content);
        child.stdin.end();
    } catch (e) {
        console.error("Error reading/piping file:", e);
    }
};

run();
