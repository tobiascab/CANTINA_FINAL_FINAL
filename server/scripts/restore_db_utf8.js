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

    console.log(`Restoring to ${config.db} on port ${config.port} forcing UTF8MB4...`);

    const args = [
        '-u', config.user,
        `-P${config.port}`,
        '--default-character-set=utf8mb4', // FORCE MYSQL TO EXPECT UTF8
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
        // Read as UTF-16LE because the file HAS BOM or is UTF-16LE
        console.log("Reading file as UTF-16LE...");
        const content = fs.readFileSync(sqlPath, 'utf16le');

        // Node converts the JS string (UTF-16) to UTF-8 when writing to the stream
        // unless specified otherwise. 'mysql' input expects UTF-8 based on our flag.
        child.stdin.write(content);
        child.stdin.end();
    } catch (e) {
        console.error("Error reading/piping file:", e);
    }
};

run();
