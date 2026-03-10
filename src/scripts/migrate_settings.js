require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rt_system',
    });

    const columns = [
        { name: 'provinsi', type: "VARCHAR(100) DEFAULT ''" },
        { name: 'kota', type: "VARCHAR(100) DEFAULT ''" },
        { name: 'kecamatan', type: "VARCHAR(100) DEFAULT ''" },
        { name: 'kelurahan', type: "VARCHAR(100) DEFAULT ''" },
        { name: 'rw', type: "VARCHAR(10) DEFAULT ''" },
        { name: 'pic_status', type: "VARCHAR(50) DEFAULT 'Ketua'" },
        { name: 'logo_kop', type: "VARCHAR(255) DEFAULT ''" },
    ];

    for (const col of columns) {
        try {
            await pool.query(`ALTER TABLE organization_settings ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Column '${col.name}' added`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  Column '${col.name}' already exists, skipping`);
            } else {
                console.error(`❌ Error adding '${col.name}':`, err.message);
            }
        }
    }

    console.log('\n✅ Migration complete!');
    await pool.end();
}

migrate();
