import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAdmin, jsonResponse, errorResponse, checkRateLimit } from "@/lib/api-helpers";
import cache, { CACHE_TTL } from "@/lib/cache";
import { validateFileOrError, ALLOWED_DOC_TYPES } from "@/lib/file-validator";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const [rows]: any = await pool.query("SELECT * FROM pengumuman WHERE id = ?", [id]);
            if (rows.length === 0) return errorResponse("Not found", 404);
            return jsonResponse(rows[0]);
        }

        const data = await cache.getOrSet('pengumuman:list', CACHE_TTL.PENGUMUMAN, async () => {
            const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM pengumuman ORDER BY tanggal_dibuat DESC");
            return rows;
        });

        return jsonResponse(data, { maxAge: 60 });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}

export async function POST(req: Request) {
    // Rate limit: upload operations
    const rateLimitError = checkRateLimit(req, 'UPLOAD');
    if (rateLimitError) return rateLimitError;

    const { error } = await requireAdmin();
    if (error) return error;

    try {
        const formData = await req.formData();
        const judul = formData.get("judul") as string;
        const isi = formData.get("isi") as string;
        const file = formData.get("lampiran") as File | null;

        // Validate uploaded file (allow documents: images + PDF)
        if (file && file.size > 0) {
            const fileError = validateFileOrError(file, { allowedTypes: ALLOWED_DOC_TYPES });
            if (fileError) return fileError;
        }

        let lampiranPath = null;

        if (file && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const uploadDir = path.join(process.cwd(), "public/uploads/pengumuman");
            await writeFile(path.join(uploadDir, filename), buffer);
            lampiranPath = `/uploads/pengumuman/${filename}`;
        }

        const [result]: any = await pool.query(
            "INSERT INTO pengumuman (judul, isi, lampiran) VALUES (?, ?, ?)",
            [judul, isi, lampiranPath]
        );

        cache.invalidate('pengumuman');

        return jsonResponse({ message: "Created", id: result.insertId }, { status: 201 });
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
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID required", 400);

    try {
        await pool.query("DELETE FROM pengumuman WHERE id = ?", [id]);
        cache.invalidate('pengumuman');
        return jsonResponse({ message: "Deleted" });
    } catch (error) {
        console.error(error);
        return errorResponse();
    }
}
