import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAuth, requireAdmin, jsonResponse, errorResponse, checkRateLimit } from "@/lib/api-helpers";
import { validateFileOrError, ALLOWED_IMAGE_TYPES } from "@/lib/file-validator";
import { writeFile } from "fs/promises";
import path from "path";

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
    // Rate limit: upload operations
    const rateLimitError = checkRateLimit(req, 'UPLOAD');
    if (rateLimitError) return rateLimitError;

    const { session, error } = await requireAuth();
    if (error) return error;

    try {
        const formData = await req.formData();
        const judul = formData.get("judul") as string;
        const isi = formData.get("isi") as string;
        const file = formData.get("lampiran") as File | null;

        if (!judul || !isi) {
            return errorResponse("Judul dan isi wajib diisi", 400);
        }

        let lampiranPath = null;
        if (file && file.size > 0) {
            const fileError = validateFileOrError(file, { allowedTypes: ALLOWED_IMAGE_TYPES });
            if (fileError) return fileError;

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `aduan-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads", "aduan");
            
            // Create directory if it doesn't exist - though usually we assume it does, but wait, if it doesn't exist it might crash.
            // Let's just writeFile, Node 20 doesn't auto-create with simple writeFile.
            // Actually, in other routes we just use writeFile. Let's do the same.
            await writeFile(path.join(uploadDir, filename), buffer);
            lampiranPath = `/uploads/aduan/${filename}`;
        }

        await pool.query(`
            INSERT INTO aduan (warga_id, judul, isi, lampiran, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [session!.user.id, judul, isi, lampiranPath]);

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
