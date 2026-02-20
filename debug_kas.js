const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function debugKas() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("Connected to DB");

        // Check table structure
        const [columns] = await connection.execute("SHOW COLUMNS FROM kas");
        console.log("Kas Columns:", columns.map(c => `${c.Field} (${c.Type})`));

        // Check table data
        const [rows] = await connection.execute("SELECT * FROM kas ORDER BY id DESC LIMIT 5");
        console.log("Recent Kas Entries:", rows);

        // Check Iuran data
        const [iuranRows] = await connection.execute("SELECT * FROM iuran WHERE status_bayar = 'lunas' ORDER BY id DESC LIMIT 5");
        console.log("Recent Lunas Iuran:", iuranRows.map(i => ({ id: i.id, nominal: i.nominal, date: i.tanggal_bayar })));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

debugKas();
