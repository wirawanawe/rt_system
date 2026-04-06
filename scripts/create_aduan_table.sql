-- Script untuk membuat tabel aduan
-- Jalankan di MySQL: mysql -u root -p nama_database < scripts/create_aduan_table.sql

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
    FOREIGN KEY (warga_id) REFERENCES warga(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_aduan_warga_id ON aduan(warga_id);
CREATE INDEX IF NOT EXISTS idx_aduan_status ON aduan(status);
