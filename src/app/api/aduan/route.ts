import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth, requireAdmin, jsonResponse, errorResponse, checkRateLimit } from "@/lib/api-helpers";

export async function GET(req: Request) {
    const { session, error } = await requireAuth();
    if (error) return error;

    try {
        if (session!.user.role === "pengurus") {
            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT aduan.*, warga.nama, warga.alamat
                FROM aduan
                JOIN warga ON aduan.warga_id = warga.id
                ORDER BY aduan.tanggal_dibuat DESC
            `);
            return jsonResponse(rows);
        } else {
            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT * FROM aduan
                WHERE warga_id = ?
                ORDER BY tanggal_dibuat DESC
            `, [session!.user.id]);
            return jsonResponse(rows);
        }
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}

export async function POST(req: Request) {
    const rateLimitError = checkRateLimit(req, 'WRITE');
    if (rateLimitError) return rateLimitError;

    const { session, error } = await requireAuth();
    if (error) return error;

    try {
        const body = await req.json();
        const { judul, isi } = body;

        if (!judul || !isi) {
            return errorResponse("Judul dan isi wajib diisi", 400);
        }

        await pool.query(`
            INSERT INTO aduan (warga_id, judul, isi, status)
            VALUES (?, ?, ?, 'pending')
        `, [session!.user.id, judul, isi]);

        return jsonResponse({ message: "Aduan berhasil dikirim" }, { status: 201 });
    } catch (error) {
        console.error(error);
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
        const { id, status, balasan } = body;

        await pool.query(`
            UPDATE aduan
            SET status = ?, balasan = ?, balasan_dibaca = 0, tanggal_diperbarui = NOW()
            WHERE id = ?
        `, [status, balasan || null, id]);

        return jsonResponse({ message: "Aduan diperbarui" });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}

export async function PATCH(req: Request) {
    const { session, error } = await requireAuth();
    if (error) return error;

    try {
        await pool.query(
            "UPDATE aduan SET balasan_dibaca = 1 WHERE warga_id = ? AND balasan IS NOT NULL AND balasan_dibaca = 0",
            [session!.user.id]
        );
        return jsonResponse({ message: "Ditandai sudah dibaca" });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}
