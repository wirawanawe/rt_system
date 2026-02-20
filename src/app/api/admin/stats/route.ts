import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'pengurus') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const connection = await pool.getConnection();
        try {
            // Count pending iuran
            const [iuranRows] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as count FROM iuran WHERE status_bayar = 'pending'"
            );
            const pending_iuran = iuranRows[0].count;

            // Count pending surat
            const [suratRows] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as count FROM surat WHERE status = 'pending'"
            );
            const pending_surat = suratRows[0].count;

            // Count pending aduan
            const [aduanRows] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as count FROM aduan WHERE status = 'pending'"
            );
            const pending_aduan = aduanRows[0].count;

            const pending_warga = 0;

            return NextResponse.json({
                pending_iuran,
                pending_surat,
                pending_warga,
                pending_aduan
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
