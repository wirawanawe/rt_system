"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
    const [nik, setNik] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                nik,
                password,
            });

            if (res?.error) {
                toast({ title: "Login Gagal", description: "NIK atau Password salah", variant: "destructive" });
            } else {
                toast({ title: "Login Berhasil", description: "Mengalihkan..." });

                // Fetch session to determine role
                const sessionRes = await fetch("/api/auth/session");
                const sessionData = await sessionRes.json();

                if (sessionData?.user?.role === "pengurus") {
                    router.push("/admin");
                } else {
                    router.push("/warga");
                }
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Masuk ke PETIR App</CardTitle>
                    <CardDescription className="text-center">
                        Masukkan NIK dan Password Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nik">NIK</Label>
                            <Input
                                id="nik"
                                placeholder="16 digit NIK"
                                value={nik}
                                onChange={(e) => setNik(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Memproses..." : "Masuk"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm text-gray-500">
                        <p>Belum punya akun? Hubungi pengurus RT.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
