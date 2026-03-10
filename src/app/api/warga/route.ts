import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { requireAuth, requireAdmin, jsonResponse, errorResponse, checkRateLimit } from '@/lib/api-helpers';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            if (session!.user.role !== 'pengurus' && session!.user.id !== id) {
                return errorResponse('Forbidden', 403);
            }

            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT id, nama, nik, alamat, status_tinggal, role, created_at FROM warga WHERE id = ?', [id]
            );
            if (rows.length === 0) return errorResponse('Not found', 404);
            return jsonResponse(rows[0]);
        } else {
            if (session!.user.role !== 'pengurus') {
                return errorResponse('Forbidden', 403);
            }

            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT id, nama, nik, alamat, status_tinggal, role, created_at FROM warga ORDER BY nama ASC'
            );
            return jsonResponse(rows);
        }
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
        const { nama, nik, password, alamat, status_tinggal, role } = body;

        if (!nama || !nik || !password) {
            return errorResponse('Missing required fields', 400);
        }

        const hashedPassword = await hash(password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO warga (nama, nik, password, alamat, status_tinggal, role) VALUES (?, ?, ?, ?, ?, ?)`,
            [nama, nik, hashedPassword, alamat, status_tinggal || 'tetap', role || 'warga']
        );

        return jsonResponse({ id: result.insertId, message: 'Warga created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return errorResponse('NIK already exists', 409);
        }
        return errorResponse();
    }
}

export async function PUT(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await req.json();
        const { id, nama, nik, alamat, status_tinggal, role } = body;

        if (!id) return errorResponse('ID is required', 400);

        const updates: string[] = [];
        const values: any[] = [];
        if (nama) { updates.push('nama = ?'); values.push(nama); }
        if (nik) { updates.push('nik = ?'); values.push(nik); }
        if (alamat) { updates.push('alamat = ?'); values.push(alamat); }
        if (status_tinggal) { updates.push('status_tinggal = ?'); values.push(status_tinggal); }
        if (role) { updates.push('role = ?'); values.push(role); }

        if (updates.length === 0) return jsonResponse({ message: 'No changes' });

        values.push(id);

        await pool.query(`UPDATE warga SET ${updates.join(', ')} WHERE id = ?`, values);

        return jsonResponse({ message: 'Warga updated successfully' });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}

export async function DELETE(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('ID required', 400);

    try {
        await pool.query('DELETE FROM warga WHERE id = ?', [id]);
        return jsonResponse({ message: 'Warga deleted' });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}
