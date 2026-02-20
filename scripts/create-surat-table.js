const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createSuratTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Creating surat table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS surat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        warga_id INT NOT NULL,
        jenis_surat VARCHAR(100) NOT NULL,
        keperluan TEXT NOT NULL,
        keterangan TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        nomor_surat VARCHAR(50),
        tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (warga_id) REFERENCES warga(id) ON DELETE CASCADE
      );
    `);
        console.log('Table surat created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await connection.end();
    }
}

createSuratTable();
