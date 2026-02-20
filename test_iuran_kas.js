const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function testFlow() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("Connected to DB");

        // 1. Create a pending Iuran
        const [warga] = await connection.execute("SELECT id FROM warga LIMIT 1");
        const wargaId = warga[0].id;

        const [result] = await connection.execute(
            "INSERT INTO iuran (warga_id, bulan, tahun, nominal, status_bayar) VALUES (?, 'TestBulan', 2099, 50000, 'pending')",
            [wargaId]
        );
        const iuranId = result.insertId;
        console.log("Created valid pending Iuran ID:", iuranId);

        // 2. Call PUT API (Simulated) - We can't easily call the Next.js API from here without running fetch against localhost
        // Instead, we will replicate the exact logic used in the API to see if it fails at database level

        console.log("Simulating API Logic...");

        await connection.beginTransaction();

        const [rows] = await connection.query(
            "SELECT i.*, w.nama FROM iuran i JOIN warga w ON i.warga_id = w.id WHERE i.id = ?",
            [iuranId]
        );
        const iuran = rows[0];
        console.log("Fetched Iuran:", iuran);

        await connection.query('UPDATE iuran SET status_bayar = ? WHERE id = ?', ['lunas', iuranId]);
        console.log("Updated status to lunas");

        // Add to Kas logic
        const [kasRows] = await connection.query(
            "SELECT id FROM kas WHERE sumber = 'iuran' AND ref_id = ?",
            [iuranId]
        );

        if (kasRows.length === 0) {
            console.log("Inserting into Kas...");
            await connection.query(
                "INSERT INTO kas (type, nominal, keterangan, sumber, ref_id, tanggal) VALUES ('pemasukan', ?, ?, 'iuran', ?, NOW())",
                [iuran.nominal, `Iuran ${iuran.bulan} ${iuran.tahun} - ${iuran.nama}`, iuranId]
            );
            console.log("Inserted into Kas");
        } else {
            console.log("Already in Kas");
        }

        await connection.commit();
        console.log("Transaction committed");

        // Verify
        const [check] = await connection.execute("SELECT * FROM kas WHERE ref_id = ?", [iuranId]);
        console.log("Kas Verification:", check);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testFlow();
