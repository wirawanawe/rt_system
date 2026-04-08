import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { hash, compare } from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { oldPassword, newPassword } = body;

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { error: "Password lama dan baru wajib diisi" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "Password baru minimal 6 karakter" },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Fetch user to verify old password
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT password FROM warga WHERE id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
        }

        const user = rows[0];

        // Verify old password
        const isPasswordValid = await compare(oldPassword, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Password lama tidak sesuai" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedNewPassword = await hash(newPassword, 10);

        // Update password
        await pool.query("UPDATE warga SET password = ? WHERE id = ?", [
            hashedNewPassword,
            userId,
        ]);

        return NextResponse.json({ message: "Password berhasil diubah" });
    } catch (error: any) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem" },
            { status: 500 }
        );
    }
}
