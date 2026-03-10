import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requireAuth, requireAdmin, jsonResponse, errorResponse, checkRateLimit } from '@/lib/api-helpers';
import { validateFileOrError, ALLOWED_IMAGE_TYPES } from '@/lib/file-validator';
import { writeFile } from "fs/promises";
import path from "path";

export async function PUT(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { id, status_bayar } = body;

        if (!id || !status_bayar) return errorResponse('Missing fields', 400);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query<RowDataPacket[]>(
                "SELECT i.*, w.nama FROM iuran i JOIN warga w ON i.warga_id = w.id WHERE i.id = ?",
                [id]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return errorResponse('Not found', 404);
            }

            const iuran = rows[0];
            await connection.query('UPDATE iuran SET status_bayar = ? WHERE id = ?', [status_bayar, id]);

            if (status_bayar === 'lunas') {
                await connection.query(
                    `INSERT INTO kas (type, nominal, keterangan, sumber, ref_id, tanggal) 
                     SELECT 'pemasukan', ?, ?, 'iuran', ?, NOW()
                     FROM DUAL
                     WHERE NOT EXISTS (SELECT 1 FROM kas WHERE sumber = 'iuran' AND ref_id = ?)`,
                    [iuran.nominal, `Iuran ${iuran.bulan} ${iuran.tahun} - ${iuran.nama}`, id, id]
                );
            }

            await connection.commit();
            return jsonResponse({ message: 'Status updated' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}

export async function GET(req: Request) {
    const { session, error } = await requireAuth();
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode');

        if (session!.user.role === 'pengurus' && mode === 'rekap') {
            const bulan = searchParams.get('bulan');
            const tahun = searchParams.get('tahun');

            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT w.id as warga_id, w.nama as nama_warga, i.id as iuran_id, i.status_bayar, i.nominal, i.tanggal_bayar, i.bukti_bayar 
                FROM warga w 
                LEFT JOIN iuran i ON w.id = i.warga_id AND i.bulan = ? AND i.tahun = ? 
                WHERE w.role = 'warga'
                ORDER BY w.nama ASC
            `, [bulan, tahun]);

            return jsonResponse(rows);
        }

        let query = 'SELECT i.id, i.warga_id, i.bulan, i.tahun, i.nominal, i.status_bayar, i.bukti_bayar, i.tanggal_bayar, w.nama as nama_warga FROM iuran i JOIN warga w ON i.warga_id = w.id';
        const params: any[] = [];

        if (session!.user.role !== 'pengurus') {
            query += ' WHERE i.warga_id = ?';
            params.push(session!.user.id);
        }

        query += ' ORDER BY i.tanggal_bayar DESC';

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return jsonResponse(rows);
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}

export async function POST(req: Request) {
    // Rate limit: upload operations
    const rateLimitError = checkRateLimit(req, 'UPLOAD');
    if (rateLimitError) return rateLimitError;

    const { session, error } = await requireAuth();
    if (error) return error;

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

        if (session!.user.role !== 'pengurus') {
            warga_id = (session!.user.id || 0).toString();
            status_bayar = 'pending';
        } else {
            if (!warga_id) return errorResponse('warga_id required for admin', 400);
        }

        if (!startBulan || !startTahun || !nominal) {
            return errorResponse('Missing required fields', 400);
        }

        const startMonthIndex = months.indexOf(startBulan);
        if (startMonthIndex === -1) return errorResponse('Invalid month', 400);

        // Validate uploaded file
        if (file && file.size > 0) {
            const fileError = validateFileOrError(file);
            if (fileError) return fileError;
        }

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

            const monthsToInsert: { bulan: string; tahun: number }[] = [];
            for (let i = 0; i < jml_bulan; i++) {
                const currentMonthIndex = (startMonthIndex + i) % 12;
                const yearOffset = Math.floor((startMonthIndex + i) / 12);
                monthsToInsert.push({
                    bulan: months[currentMonthIndex],
                    tahun: startTahun + yearOffset,
                });
            }

            // Batch existence check
            const placeholders = monthsToInsert.map(() => '(bulan = ? AND tahun = ?)').join(' OR ');
            const checkParams: any[] = [warga_id];
            monthsToInsert.forEach(m => checkParams.push(m.bulan, m.tahun));

            const [existing] = await connection.query<RowDataPacket[]>(
                `SELECT bulan, tahun FROM iuran WHERE warga_id = ? AND status_bayar IN ('pending', 'lunas') AND (${placeholders})`,
                checkParams
            );

            if (existing.length > 0) {
                const dup = existing[0];
                throw new Error(`Pembayaran untuk ${dup.bulan} ${dup.tahun} sudah ada/sedang diproses.`);
            }

            // Batch insert
            const insertValues = monthsToInsert.map(m => [warga_id, m.bulan, m.tahun, nominal, status_bayar || 'pending', buktiBayarPath]);
            const insertPlaceholders = insertValues.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
            const insertParams = insertValues.flat();

            await connection.query(
                `INSERT INTO iuran (warga_id, bulan, tahun, nominal, status_bayar, bukti_bayar) VALUES ${insertPlaceholders}`,
                insertParams
            );

            await connection.commit();
            return jsonResponse({ message: 'Pembayaran berhasil disimpan' }, { status: 201 });
        } catch (error: any) {
            await connection.rollback();
            console.error('Transaction error:', error);
            return errorResponse(error.message || 'Transaction failed', 400);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}
