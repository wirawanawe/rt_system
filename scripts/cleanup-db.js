const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function dropUnusedTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const tablesToDrop = ['announcements', 'letters', 'payments', 'residents', 'users'];

        for (const table of tablesToDrop) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped table: ${table}`);
            } catch (e) {
                console.error(`Failed to drop ${table}:`, e.message);
            }
        }
        console.log('Cleanup complete.');

    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        await connection.end();
    }
}

dropUnusedTables();
