CREATE TABLE IF NOT EXISTS organization_settings (
    id INT PRIMARY KEY DEFAULT 1,
    nama_rt VARCHAR(255) DEFAULT 'RT 001/001',
    logo VARCHAR(255) DEFAULT '/uploads/logo-placeholder.png',
    nominal_iuran DECIMAL(10, 2) DEFAULT 0,
    pic_name VARCHAR(100) DEFAULT 'Admin',
    pic_phone VARCHAR(20) DEFAULT '6281234567890'
);

INSERT IGNORE INTO organization_settings (id, nama_rt, logo, nominal_iuran, pic_name, pic_phone) 
VALUES (1, 'RT 001/001', '/uploads/logo-placeholder.png', 50000, 'Budi Santoso', '6281234567890');
