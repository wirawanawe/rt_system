import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const [rows]: any = await db.query("SELECT * FROM pengumuman WHERE id = ?", [id]);
            if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
            return NextResponse.json(rows[0]);
        }

        const [rows] = await db.query("SELECT * FROM pengumuman ORDER BY tanggal_dibuat DESC");
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "pengurus") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const judul = formData.get("judul") as string;
        const isi = formData.get("isi") as string;
        const file = formData.get("lampiran") as File | null;

        let lampiranPath = null;

        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");
            const uploadDir = path.join(process.cwd(), "public/uploads/pengumuman");

            await writeFile(path.join(uploadDir, filename), buffer);
            lampiranPath = `/uploads/pengumuman/${filename}`;
        }

        const [result]: any = await db.query(
            "INSERT INTO pengumuman (judul, isi, lampiran) VALUES (?, ?, ?)",
            [judul, isi, lampiranPath]
        );

        return NextResponse.json({ message: "Created", id: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "pengurus") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await db.query("DELETE FROM pengumuman WHERE id = ?", [id]);
        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
}
