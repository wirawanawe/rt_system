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
                SELECT surat.*, warga.nama, warga.nik 
                FROM surat 
                JOIN warga ON surat.warga_id = warga.id 
                ORDER BY surat.tanggal_dibuat DESC
            `);
            return jsonResponse(rows);
        } else {
            const [rows] = await pool.query<RowDataPacket[]>(`
                SELECT * FROM surat 
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
        const contentType = req.headers.get("content-type") || "";

        let jenis_surat, keperluan, keterangan;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            jenis_surat = formData.get("jenis_surat") as string;
            keperluan = formData.get("keperluan") as string;
            keterangan = formData.get("keterangan") as string;
        } else {
            const body = await req.json();
            jenis_surat = body.jenis_surat;
            keperluan = body.keperluan;
            keterangan = body.keterangan;
        }

        await pool.query(`
            INSERT INTO surat (warga_id, jenis_surat, keperluan, keterangan, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [session!.user.id, jenis_surat, keperluan, keterangan]);

        return jsonResponse({ message: "Request created" }, { status: 201 });
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
        const { id, status, nomor_surat } = body;

        await pool.query(`
            UPDATE surat SET status = ?, nomor_surat = ? WHERE id = ?
        `, [status, nomor_surat, id]);

        return jsonResponse({ message: "Updated" });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}
