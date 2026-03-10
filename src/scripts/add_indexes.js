require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addIndexes() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rt_system',
    });

    const indexes = [
        // Warga
        { name: 'idx_warga_nik', sql: 'CREATE UNIQUE INDEX idx_warga_nik ON warga(nik)' },
        { name: 'idx_warga_role', sql: 'CREATE INDEX idx_warga_role ON warga(role)' },

        // Iuran
        { name: 'idx_iuran_warga_bulan_tahun', sql: 'CREATE INDEX idx_iuran_warga_bulan_tahun ON iuran(warga_id, bulan, tahun)' },
        { name: 'idx_iuran_status', sql: 'CREATE INDEX idx_iuran_status ON iuran(status_bayar)' },

        // Surat
        { name: 'idx_surat_warga', sql: 'CREATE INDEX idx_surat_warga ON surat(warga_id)' },
        { name: 'idx_surat_status', sql: 'CREATE INDEX idx_surat_status ON surat(status)' },

        // Aduan
        { name: 'idx_aduan_warga', sql: 'CREATE INDEX idx_aduan_warga ON aduan(warga_id)' },
        { name: 'idx_aduan_status', sql: 'CREATE INDEX idx_aduan_status ON aduan(status)' },

        // Kas
        { name: 'idx_kas_tanggal', sql: 'CREATE INDEX idx_kas_tanggal ON kas(tanggal)' },
        { name: 'idx_kas_sumber_ref', sql: 'CREATE INDEX idx_kas_sumber_ref ON kas(sumber, ref_id)' },
        { name: 'idx_kas_type', sql: 'CREATE INDEX idx_kas_type ON kas(type)' },

        // Pengumuman
        { name: 'idx_pengumuman_tanggal', sql: 'CREATE INDEX idx_pengumuman_tanggal ON pengumuman(tanggal_dibuat)' },
    ];

    for (const idx of indexes) {
        try {
            await pool.query(idx.sql);
            console.log(`✅ Index '${idx.name}' created`);
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log(`⏭️  Index '${idx.name}' already exists`);
            } else {
                console.error(`❌ Error creating '${idx.name}':`, err.message);
            }
        }
    }

    console.log('\n✅ Index migration complete!');
    await pool.end();
}

addIndexes();
