import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requireAdmin, jsonResponse, errorResponse, checkRateLimit } from '@/lib/api-helpers';

// Optimized: single query for both filtered summary and global saldo
async function getSummary(month?: number, year?: number) {
    if (month && year) {
        // Single query: filtered totals + global saldo in one round trip
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                COALESCE(SUM(CASE WHEN MONTH(tanggal) = ? AND YEAR(tanggal) = ? AND type = 'pemasukan' THEN nominal END), 0) as total_masuk,
                COALESCE(SUM(CASE WHEN MONTH(tanggal) = ? AND YEAR(tanggal) = ? AND type = 'pengeluaran' THEN nominal END), 0) as total_keluar,
                COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN nominal ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN nominal ELSE 0 END), 0) as saldo
            FROM kas
        `, [month, year, month, year]);

        return {
            saldo: Number(rows[0].saldo),
            total_masuk: Number(rows[0].total_masuk),
            total_keluar: Number(rows[0].total_keluar),
        };
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'pemasukan' THEN nominal ELSE 0 END), 0) as total_masuk,
            COALESCE(SUM(CASE WHEN type = 'pengeluaran' THEN nominal ELSE 0 END), 0) as total_keluar
        FROM kas
    `);

    const total_masuk = Number(rows[0].total_masuk);
    const total_keluar = Number(rows[0].total_keluar);

    return {
        saldo: total_masuk - total_keluar,
        total_masuk,
        total_keluar,
    };
}

export async function GET(req: Request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode');
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

        if (mode === 'summary') {
            const summary = await getSummary(month, year);
            return jsonResponse(summary);
        }

        let query = "SELECT * FROM kas";
        const params: any[] = [];

        if (month && year) {
            query += " WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?";
            params.push(month, year);
        }

        query += " ORDER BY tanggal DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return jsonResponse(rows);
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}

export async function POST(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { type, nominal, keterangan, tanggal } = body;

        if (!type || !nominal || !keterangan) {
            return errorResponse('Missing required fields', 400);
        }

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO kas (type, nominal, keterangan, tanggal, sumber) VALUES (?, ?, ?, ?, 'manual')",
            [type, nominal, keterangan, tanggal || new Date()]
        );

        return jsonResponse({ id: result.insertId, message: 'Transaction recorded' }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}

export async function DELETE(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return errorResponse('ID required', 400);

        const [rows] = await pool.query<RowDataPacket[]>("SELECT sumber FROM kas WHERE id = ?", [id]);
        if (rows.length === 0) return errorResponse('Not found', 404);

        if (rows[0].sumber === 'iuran') {
            return errorResponse('Cannot delete automated Iuran transaction manually', 400);
        }

        await pool.query("DELETE FROM kas WHERE id = ?", [id]);
        return jsonResponse({ message: 'Deleted' });
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}
