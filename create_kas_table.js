const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function createTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS kas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('pemasukan', 'pengeluaran') NOT NULL,
                nominal DECIMAL(15,2) NOT NULL,
                keterangan TEXT,
                tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
                sumber ENUM('manual', 'iuran') DEFAULT 'manual',
                ref_id INT NULL,
                INDEX (type),
                INDEX (sumber)
            );
        `);

        console.log('Table kas created successfully');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTable();
