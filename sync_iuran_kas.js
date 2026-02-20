const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function syncIuranToKas() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log("Connected to DB");

        // Get all Lunas Iuran
        const [iuranList] = await connection.execute(
            "SELECT i.*, w.nama FROM iuran i JOIN warga w ON i.warga_id = w.id WHERE i.status_bayar = 'lunas'"
        );
        console.log(`Found ${iuranList.length} lunas Iuran records.`);

        let insertedCount = 0;

        for (const iuran of iuranList) {
            const [kasRows] = await connection.execute(
                "SELECT id FROM kas WHERE sumber = 'iuran' AND ref_id = ?",
                [iuran.id]
            );

            if (kasRows.length === 0) {
                console.log(`Syncing Iuran ID ${iuran.id} (${iuran.bulan}/${iuran.tahun})...`);
                await connection.execute(
                    "INSERT INTO kas (type, nominal, keterangan, sumber, ref_id, tanggal) VALUES ('pemasukan', ?, ?, 'iuran', ?, ?)",
                    [
                        iuran.nominal,
                        `Iuran ${iuran.bulan} ${iuran.tahun} - ${iuran.nama}`,
                        iuran.id,
                        iuran.tanggal_bayar || new Date() // Use original payment date if available
                    ]
                );
                insertedCount++;
            }
        }

        console.log(`Sync complete. Inserted ${insertedCount} missing records.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

syncIuranToKas();
