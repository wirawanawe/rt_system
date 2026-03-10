import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-helpers';
import cache, { CACHE_TTL } from '@/lib/cache';

export async function GET(req: Request) {
    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const stats = await cache.getOrSet('admin:stats', CACHE_TTL.STATS, async () => {
            // Single query with subqueries instead of 3 separate COUNT queries
            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT
                    (SELECT COUNT(*) FROM iuran WHERE status_bayar = 'pending') as pending_iuran,
                    (SELECT COUNT(*) FROM surat WHERE status = 'pending') as pending_surat,
                    (SELECT COUNT(*) FROM aduan WHERE status = 'pending') as pending_aduan
            `);

            return {
                pending_iuran: rows[0].pending_iuran,
                pending_surat: rows[0].pending_surat,
                pending_warga: 0,
                pending_aduan: rows[0].pending_aduan,
            };
        });

        return jsonResponse(stats, { maxAge: 30 });
    } catch (error) {
        console.error('Database error:', error);
        return errorResponse();
    }
}
