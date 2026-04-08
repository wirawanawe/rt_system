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
    const [loginAs, setLoginAs] = useState("warga");
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
                loginAs,
            });

            if (res?.error) {
                toast({ title: "Login Gagal", description: res.error || "NIK atau Password salah", variant: "destructive" });
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
                        <div className="space-y-2">
                            <Label htmlFor="loginAs">Login Sebagai</Label>
                            <select
                                id="loginAs"
                                value={loginAs}
                                onChange={(e) => setLoginAs(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="warga">Warga</option>
                                <option value="pengurus">Pengurus RT</option>
                            </select>
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
