import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile } from "fs/promises";
import path from "path";

// Helper for admin validation
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, status_bayar } = body;

        if (!id || !status_bayar) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get Iuran details
            const [rows] = await connection.query<RowDataPacket[]>(
                "SELECT i.*, w.nama FROM iuran i JOIN warga w ON i.warga_id = w.id WHERE i.id = ?",
                [id]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const iuran = rows[0];

            // Update Status
            await connection.query('UPDATE iuran SET status_bayar = ? WHERE id = ?', [status_bayar, id]);

            // Add to Kas if Lunas
            if (status_bayar === 'lunas') {
                // Check if already recorded
                const [kasRows] = await connection.query<RowDataPacket[]>(
                    "SELECT id FROM kas WHERE sumber = 'iuran' AND ref_id = ?",
                    [id]
                );

                if (kasRows.length === 0) {
                    await connection.query(
                        "INSERT INTO kas (type, nominal, keterangan, sumber, ref_id, tanggal) VALUES ('pemasukan', ?, ?, 'iuran', ?, NOW())",
                        [iuran.nominal, `Iuran ${iuran.bulan} ${iuran.tahun} - ${iuran.nama}`, id]
                    );
                }
            }

            await connection.commit();
            return NextResponse.json({ message: 'Status updated' });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        let query = 'SELECT i.id, i.warga_id, i.bulan, i.tahun, i.nominal, i.status_bayar, i.bukti_bayar, i.tanggal_bayar, w.nama as nama_warga FROM iuran i JOIN warga w ON i.warga_id = w.id';
        const params: any[] = [];

        // If not admin, restrict to own data
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode');

        if (session.user.role === 'pengurus' && mode === 'rekap') {
            const bulan = searchParams.get('bulan');
            const tahun = searchParams.get('tahun');

            // Get all residents and left join with iuran for specific month/year
            query = `
                SELECT w.id as warga_id, w.nama as nama_warga, i.id as iuran_id, i.status_bayar, i.nominal, i.tanggal_bayar, i.bukti_bayar 
                FROM warga w 
                LEFT JOIN iuran i ON w.id = i.warga_id AND i.bulan = ? AND i.tahun = ? 
                WHERE w.role = 'warga'
                ORDER BY w.nama ASC
            `;
            // Clear params and push new ones
            // Clear params and push new ones
            while (params.length > 0) params.pop();
            params.push(bulan, tahun);
        } else {
            if (session.user.role !== 'pengurus') {
                query += ' WHERE i.warga_id = ?';
                params.push(session.user.id);
            }
            query += ' ORDER BY i.tanggal_bayar DESC';
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        const formData = await req.formData();
        let warga_id = formData.get("warga_id") as string | null;
        const startBulan = formData.get("bulan") as string;
        const startTahun = parseInt(formData.get("tahun") as string);
        const jml_bulan = parseInt(formData.get("jml_bulan") as string) || 1;
        const nominal = formData.get("nominal") as string;
        let status_bayar = formData.get("status_bayar") as string | undefined;
        const file = formData.get("bukti_bayar") as File | null;

        if (session.user.role !== 'pengurus') {
            warga_id = (session.user.id || 0).toString();
            status_bayar = 'pending';
        } else {
            if (!warga_id) return NextResponse.json({ error: 'warga_id required for admin' }, { status: 400 });
        }

        if (!startBulan || !startTahun || !nominal) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const startMonthIndex = months.indexOf(startBulan);
        if (startMonthIndex === -1) return NextResponse.json({ error: 'Invalid month' }, { status: 400 });

        // Upload file once
        let buktiBayarPath = null;
        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `iuran-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "iuran");
            await writeFile(path.join(uploadDir, filename), buffer);
            buktiBayarPath = `/uploads/iuran/${filename}`;
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (let i = 0; i < jml_bulan; i++) {
                const currentMonthIndex = (startMonthIndex + i) % 12;
                const yearOffset = Math.floor((startMonthIndex + i) / 12);
                const targetTahun = startTahun + yearOffset;
                const targetBulan = months[currentMonthIndex];

                // Check duplicate
                const [existing] = await connection.query<RowDataPacket[]>(
                    "SELECT id FROM iuran WHERE warga_id = ? AND bulan = ? AND tahun = ? AND status_bayar IN ('pending', 'lunas')",
                    [warga_id, targetBulan, targetTahun]
                );

                if (existing.length > 0) {
                    // If one fails, rollback all
                    throw new Error(`Pembayaran untuk ${targetBulan} ${targetTahun} sudah ada/sedang diproses.`);
                }

                await connection.query(
                    `INSERT INTO iuran (warga_id, bulan, tahun, nominal, status_bayar, bukti_bayar) VALUES (?, ?, ?, ?, ?, ?)`,
                    [warga_id, targetBulan, targetTahun, nominal, status_bayar || 'pending', buktiBayarPath]
                );
            }

            await connection.commit();
            return NextResponse.json({ message: 'Pembayaran berhasil disimpan' }, { status: 201 });

        } catch (error: any) {
            await connection.rollback();
            console.error('Transaction error:', error);
            // Delete file if transaction fails? Ideally yes, but keeping it simple for now.
            return NextResponse.json({ error: error.message || 'Transaction failed' }, { status: 400 });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
