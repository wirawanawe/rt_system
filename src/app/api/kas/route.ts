import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Helper to get total balance
async function getSummary(month?: number, year?: number) {
    let query = `
        SELECT 
            SUM(CASE WHEN type = 'pemasukan' THEN nominal ELSE 0 END) as total_masuk,
            SUM(CASE WHEN type = 'pengeluaran' THEN nominal ELSE 0 END) as total_keluar
        FROM kas
    `;

    const params: any[] = [];
    if (month && year) {
        query += " WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?";
        params.push(month, year);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Global saldo (always all time) is more useful? 
    // Or if filtered, maybe saldo for that period (Masuk - Keluar)?
    // Let's also fetch global saldo separately if filtering.

    let saldo = 0;
    if (month && year) {
        // Fetch global saldo
        const [globalRows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                SUM(CASE WHEN type = 'pemasukan' THEN nominal ELSE 0 END) -
                SUM(CASE WHEN type = 'pengeluaran' THEN nominal ELSE 0 END) as saldo
            FROM kas
        `);
        saldo = Number(globalRows[0].saldo || 0);
    } else {
        saldo = Number(rows[0].total_masuk || 0) - Number(rows[0].total_keluar || 0);
    }

    return {
        saldo,
        total_masuk: Number(rows[0].total_masuk || 0),
        total_keluar: Number(rows[0].total_keluar || 0)
    };
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode');
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

        if (mode === 'summary') {
            const summary = await getSummary(month, year);
            return NextResponse.json(summary);
        }

        let query = "SELECT * FROM kas";
        const params: any[] = [];

        if (month && year) {
            query += " WHERE MONTH(tanggal) = ? AND YEAR(tanggal) = ?";
            params.push(month, year);
        }

        query += " ORDER BY tanggal DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type, nominal, keterangan, tanggal } = body;

        if (!type || !nominal || !keterangan) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO kas (type, nominal, keterangan, tanggal, sumber) VALUES (?, ?, ?, ?, 'manual')",
            [type, nominal, keterangan, tanggal || new Date()]
        );

        return NextResponse.json({ id: result.insertId, message: 'Transaction recorded' }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Only allow deleting manual transactions? Or all? Let's allow manual only for safety.
        // Actually, let's allow all but if it's 'iuran' maybe warn? 
        // For now, strict: only manual.
        const [rows] = await pool.query<RowDataPacket[]>("SELECT sumber FROM kas WHERE id = ?", [id]);
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (rows[0].sumber === 'iuran') {
            return NextResponse.json({ error: 'Cannot delete automated Iuran transaction manually' }, { status: 400 });
        }

        await pool.query("DELETE FROM kas WHERE id = ?", [id]);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
