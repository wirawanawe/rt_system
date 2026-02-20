const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');

async function seedWarga() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const hashedPassword = await bcrypt.hash('warga123', 10);

        // Check if warga exists
        const [rows] = await connection.query('SELECT * FROM warga WHERE nik = ?', ['3201123456789001']);
        if (rows.length === 0) {
            await connection.query(`
            INSERT INTO warga (nama, nik, password, alamat, status_tinggal, role)
            VALUES ('Budi Santoso', '3201123456789001', ?, 'Jl. Mawar No. 10', 'tetap', 'warga')
        `, [hashedPassword]);
            console.log('Default Warga user created.');
            console.log('NIK: 3201123456789001');
            console.log('Pass: warga123');
        } else {
            console.log('Warga user already exists.');
        }

    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await connection.end();
    }
}

seedWarga();
