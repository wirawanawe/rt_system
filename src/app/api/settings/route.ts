import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { requireAdmin, jsonResponse, errorResponse, checkRateLimit } from "@/lib/api-helpers";
import cache, { CACHE_TTL } from "@/lib/cache";
import { validateFileOrError } from "@/lib/file-validator";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
    try {
        const settings = await cache.getOrSet('settings', CACHE_TTL.SETTINGS, async () => {
            const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM organization_settings WHERE id = 1");
            return rows[0] || {};
        });

        return jsonResponse(settings, { maxAge: 300 });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return errorResponse();
    }
}

export async function POST(request: Request) {
    // Rate limit: write operations
    const rateLimitError = checkRateLimit(request, 'WRITE');
    if (rateLimitError) return rateLimitError;

    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const formData = await request.formData();
        const nama_rt = formData.get("nama_rt") as string;
        const nominal_iuran = formData.get("nominal_iuran") as string;
        const pic_name = formData.get("pic_name") as string;
        const pic_phone = formData.get("pic_phone") as string;
        const pic_status = formData.get("pic_status") as string || "Ketua";
        const provinsi = formData.get("provinsi") as string || "";
        const kota = formData.get("kota") as string || "";
        const kecamatan = formData.get("kecamatan") as string || "";
        const kelurahan = formData.get("kelurahan") as string || "";
        const rw = formData.get("rw") as string || "";
        const app_title = formData.get("app_title") as string || "RT System";
        const logoFile = formData.get("logo") as File | null;
        const logoKopFile = formData.get("logo_kop") as File | null;

        // Validate uploaded files
        if (logoFile && logoFile.size > 0) {
            const fileError = validateFileOrError(logoFile);
            if (fileError) return fileError;
        }
        if (logoKopFile && logoKopFile.size > 0) {
            const fileError = validateFileOrError(logoKopFile);
            if (fileError) return fileError;
        }

        let logoPath = null;
        let logoKopPath = null;
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            const filename = `logo-${Date.now()}${path.extname(logoFile.name)}`;
            await writeFile(path.join(uploadDir, filename), buffer);
            logoPath = `/uploads/${filename}`;
        }

        if (logoKopFile && logoKopFile.size > 0) {
            const buffer = Buffer.from(await logoKopFile.arrayBuffer());
            const filename = `logo-kop-${Date.now()}${path.extname(logoKopFile.name)}`;
            await writeFile(path.join(uploadDir, filename), buffer);
            logoKopPath = `/uploads/${filename}`;
        }

        let query = `
            UPDATE organization_settings 
            SET nama_rt = ?, nominal_iuran = ?, pic_name = ?, pic_phone = ?,
                pic_status = ?, provinsi = ?, kota = ?, kecamatan = ?, kelurahan = ?, rw = ?, app_title = ?
        `;
        const params: any[] = [nama_rt, nominal_iuran, pic_name, pic_phone, pic_status, provinsi, kota, kecamatan, kelurahan, rw, app_title];

        if (logoPath) {
            query += `, logo = ?`;
            params.push(logoPath);
        }

        if (logoKopPath) {
            query += `, logo_kop = ?`;
            params.push(logoKopPath);
        }

        query += ` WHERE id = 1`;

        await pool.query(query, params);

        // Invalidate settings cache
        cache.invalidate('settings');

        return jsonResponse({ success: true, logo: logoPath, logo_kop: logoKopPath });
    } catch (error) {
        console.error("Error updating settings:", error);
        return errorResponse();
    }
}
