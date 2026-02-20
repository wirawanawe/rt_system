import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM organization_settings WHERE id = 1");
        // @ts-ignore
        const settings = rows[0] || {};
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "pengurus") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const nama_rt = formData.get("nama_rt") as string;
        const nominal_iuran = formData.get("nominal_iuran") as string;
        const pic_name = formData.get("pic_name") as string;
        const pic_phone = formData.get("pic_phone") as string;
        const logoFile = formData.get("logo") as File | null;

        let logoPath = null;

        if (logoFile && logoFile.size > 0) {
            const buffer = Buffer.from(await logoFile.arrayBuffer());
            const filename = `logo-${Date.now()}${path.extname(logoFile.name)}`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");

            await writeFile(path.join(uploadDir, filename), buffer);
            logoPath = `/uploads/${filename}`;
        }

        let query = `
            UPDATE organization_settings 
            SET nama_rt = ?, nominal_iuran = ?, pic_name = ?, pic_phone = ?
        `;
        const params: any[] = [nama_rt, nominal_iuran, pic_name, pic_phone];

        if (logoPath) {
            query += `, logo = ?`;
            params.push(logoPath);
        }

        query += ` WHERE id = 1`;

        await pool.query(query, params);

        return NextResponse.json({ success: true, logo: logoPath });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
