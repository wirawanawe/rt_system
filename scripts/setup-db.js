const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        console.log(`Database ${process.env.DB_NAME} created or already exists.`);

        await connection.changeUser({ database: process.env.DB_NAME });

        // Warga Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS warga (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        nik VARCHAR(16) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        alamat TEXT,
        status_tinggal ENUM('tetap', 'kontrak') DEFAULT 'tetap',
        role ENUM('warga', 'pengurus') DEFAULT 'warga',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table warga created.');

        // Iuran Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS iuran (
        id INT AUTO_INCREMENT PRIMARY KEY,
        warga_id INT NOT NULL,
        bulan VARCHAR(20) NOT NULL,
        tahun INT NOT NULL,
        nominal DECIMAL(10, 2) NOT NULL,
        status_bayar ENUM('pending', 'lunas', 'rejected') DEFAULT 'pending',
        bukti_bayar VARCHAR(255),
        tanggal_bayar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (warga_id) REFERENCES warga(id) ON DELETE CASCADE
      );
    `);
        console.log('Table iuran created.');

        // Pengumuman Table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pengumuman (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        isi TEXT NOT NULL,
        tanggal_dibuat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table pengumuman created.');

        // Create default admin user if not exists (password: admin123)
        // bcrypt hash for 'admin123' is needed. Let's use a placeholder or skip if complex.
        // For now, I'll insert a dummy admin for testing.
        // Hash for 'admin123' generated via bcryptjs: $2a$10$X7... (I will generate it in the script)
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const [rows] = await connection.query('SELECT * FROM warga WHERE nik = ?', ['1234567890123456']);
        if (rows.length === 0) {
            await connection.query(`
            INSERT INTO warga (nama, nik, password, alamat, role)
            VALUES ('Admin RT', '1234567890123456', ?, 'Kantor RT', 'pengurus')
        `, [hashedPassword]);
            console.log('Default admin user created (NIK: 1234567890123456, Pass: admin123).');
        }

    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await connection.end();
    }
}

setupDatabase();
