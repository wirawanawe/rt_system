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
                SELECT aduan.*, warga.nama, warga.alamat
                FROM aduan
                JOIN warga ON aduan.warga_id = warga.id
                ORDER BY aduan.tanggal_dibuat DESC
            `);
            return NextResponse.json(rows);
        } else {
            const [rows] = await db.query(`
                SELECT * FROM aduan
                WHERE warga_id = ?
                ORDER BY tanggal_dibuat DESC
            `, [session.user.id]);
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { judul, isi } = body;

        if (!judul || !isi) {
            return NextResponse.json({ error: "Judul dan isi wajib diisi" }, { status: 400 });
        }

        await db.query(`
            INSERT INTO aduan (warga_id, judul, isi, status)
            VALUES (?, ?, ?, 'pending')
        `, [session.user.id, judul, isi]);

        return NextResponse.json({ message: "Aduan berhasil dikirim" });
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
        const { id, status, balasan } = body;

        await db.query(`
            UPDATE aduan
            SET status = ?, balasan = ?, balasan_dibaca = 0, tanggal_diperbarui = NOW()
            WHERE id = ?
        `, [status, balasan || null, id]);

        return NextResponse.json({ message: "Aduan diperbarui" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

// Warga menandai semua aduan miliknya sebagai sudah dibaca
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await db.query(
            "UPDATE aduan SET balasan_dibaca = 1 WHERE warga_id = ? AND balasan IS NOT NULL AND balasan_dibaca = 0",
            [session.user.id]
        );
        return NextResponse.json({ message: "Ditandai sudah dibaca" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
