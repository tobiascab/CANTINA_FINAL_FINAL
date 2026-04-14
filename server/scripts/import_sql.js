const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const importSql = async () => {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true // Important for SQL dumps
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server.');

        const dbName = process.env.DB_NAME || 'cantina_reducto';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database ${dbName} created or exists.`);

        await connection.query(`USE \`${dbName}\`;`);

        // Read the SQL file. Attempting to handle potential UTF-16LE encoding.
        const sqlPath = path.join(__dirname, '../database_backup.sql');

        // Try reading as utf-16le first if hinted
        let sqlContent;
        try {
            sqlContent = fs.readFileSync(sqlPath, 'utf16le');
            if (!sqlContent.trim().startsWith('--') && !sqlContent.trim().startsWith('INSERT') && !sqlContent.trim().startsWith('CREATE') && !sqlContent.includes('MariaDB')) {
                // If doesn't look like SQL, maybe it was UTF-8 after all?
                console.log('UTF-16LE read didn\'t look like SQL, trying UTF-8...');
                sqlContent = fs.readFileSync(sqlPath, 'utf8');
            }
        } catch (e) {
            console.log('Error reading file, trying UTF-8 fallback:', e.message);
            sqlContent = fs.readFileSync(sqlPath, 'utf8');
        }

        console.log('SQL File read, length:', sqlContent.length);

        // Execute queries
        await connection.query(sqlContent);
        console.log('SQL Import successful.');

        await connection.end();
    } catch (err) {
        console.error('Error importing SQL:', err);
    }
};

importSql();
