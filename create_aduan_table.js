const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function createAduanTable() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS aduan (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warga_id INT NOT NULL,
                judul VARCHAR(255) NOT NULL,
                isi TEXT NOT NULL,
                lampiran VARCHAR(255) NULL,
                status ENUM('pending', 'proses', 'selesai') DEFAULT 'pending',
                balasan TEXT NULL,
                tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tanggal_diperbarui TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (warga_id) REFERENCES warga(id) ON DELETE CASCADE,
                INDEX idx_warga_id (warga_id),
                INDEX idx_status (status)
            )
        `);

        console.log('✅ Tabel aduan berhasil dibuat!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAduanTable();
