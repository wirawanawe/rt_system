import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                nik: { label: "NIK", type: "text" },
                password: { label: "Password", type: "password" },
                loginAs: { label: "Role", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.nik || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const [rows] = await pool.query<RowDataPacket[]>(
                    "SELECT * FROM warga WHERE nik = ?",
                    [credentials.nik]
                );

                const user = rows[0];

                if (!user || !user.password) {
                    throw new Error("User not found");
                }

                const isValid = await compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error("Invalid password");
                }

                if (credentials?.loginAs === "pengurus" && user.role !== "pengurus") {
                    throw new Error("Akses ditolak: Anda bukan pengurus");
                }

                const effectiveRole = (user.role === "pengurus" && credentials?.loginAs === "warga") 
                    ? "warga" 
                    : user.role;

                return {
                    id: user.id.toString(),
                    name: user.nama,
                    email: user.nik,
                    role: effectiveRole,
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.name = token.name;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
