import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin can see all, Warga can only see themselves (or maybe others if public directory is allowed? Assuming admin only for full list for now)
    // Let's allow admin to fetch all, and any user to fetch their own profile if ?id= is passed and matches session.id

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            // Fetch specific user
            if (session.user.role !== 'pengurus' && session.user.id !== id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const [rows] = await pool.query<RowDataPacket[]>('SELECT id, nama, nik, alamat, status_tinggal, role, created_at FROM warga WHERE id = ?', [id]);
            if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json(rows[0]);
        } else {
            // List all users (Admin only)
            if (session.user.role !== 'pengurus') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const [rows] = await pool.query<RowDataPacket[]>('SELECT id, nama, nik, alamat, status_tinggal, role, created_at FROM warga ORDER BY nama ASC');
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { nama, nik, password, alamat, status_tinggal, role } = body;

        if (!nama || !nik || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const hashedPassword = await hash(password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO warga (nama, nik, password, alamat, status_tinggal, role) VALUES (?, ?, ?, ?, ?, ?)`,
            [nama, nik, hashedPassword, alamat, status_tinggal || 'tetap', role || 'warga']
        );

        return NextResponse.json({ id: result.insertId, message: 'Warga created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Database error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'NIK already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, nama, nik, alamat, status_tinggal, role } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        // Build query dynamically
        const updates = [];
        const values = [];
        if (nama) { updates.push('nama = ?'); values.push(nama); }
        if (nik) { updates.push('nik = ?'); values.push(nik); }
        if (alamat) { updates.push('alamat = ?'); values.push(alamat); }
        if (status_tinggal) { updates.push('status_tinggal = ?'); values.push(status_tinggal); }
        if (role) { updates.push('role = ?'); values.push(role); }

        if (updates.length === 0) return NextResponse.json({ message: 'No changes' });

        values.push(id);

        await pool.query(`UPDATE warga SET ${updates.join(', ')} WHERE id = ?`, values);

        return NextResponse.json({ message: 'Warga updated successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await pool.query('DELETE FROM warga WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Warga deleted' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
