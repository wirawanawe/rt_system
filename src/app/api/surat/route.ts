import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        if (session.user.role === "pengurus") {
            const [rows] = await db.query(`
                SELECT surat.*, warga.nama, warga.nik 
                FROM surat 
                JOIN warga ON surat.warga_id = warga.id 
                ORDER BY surat.tanggal_dibuat DESC
            `);
            return NextResponse.json(rows);
        } else {
            const [rows] = await db.query(`
                SELECT * FROM surat 
                WHERE warga_id = ? 
                ORDER BY tanggal_dibuat DESC
            `, [session.user.id]);
            return NextResponse.json(rows);
        }
    } catch (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Handle both JSON and FormData for backward compatibility or future expansion
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

        await db.query(`
            INSERT INTO surat (warga_id, jenis_surat, keperluan, keterangan, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [session.user.id, jenis_surat, keperluan, keterangan]);

        return NextResponse.json({ message: "Request created" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "pengurus") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, nomor_surat } = body;

        await db.query(`
              UPDATE surat SET status = ?, nomor_surat = ? WHERE id = ?
          `, [status, nomor_surat, id]);

        return NextResponse.json({ message: "Updated" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
