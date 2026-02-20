const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const sqlPath = path.join(__dirname, '../lib/schema/settings.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to run multiple statements if needed, but for now it's simple
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            await connection.query(statement);
            console.log('Executed:', statement.substring(0, 50) + '...');
        }

        console.log('Migration completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
