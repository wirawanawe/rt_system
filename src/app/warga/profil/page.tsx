"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, User, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export default function WargaProfil() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    if (!session) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Konfirmasi password baru tidak cocok.");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter.");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    oldPassword: formData.oldPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Gagal mengubah password");
            }

            toast.success("Password berhasil diubah. Silahkan login kembali.");
            setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            
            setTimeout(() => {
                signOut({ callbackUrl: '/login' });
            }, 2000);
            
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center py-6 bg-white rounded-xl shadow-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                    <User className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold">{session.user?.name}</h2>
                <p className="text-gray-500 text-sm">{session.user?.email}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md">Info Warga</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">NIK</span>
                        <span className="font-medium">{session.user?.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Role</span>
                        <span className="font-medium capitalize">{session.user?.role}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Ganti Password</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Perbarui password Anda untuk menjaga keamanan akun.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4 text-sm">
                        <div className="space-y-2">
                            <Label htmlFor="oldPassword">Password Lama</Label>
                            <Input 
                                id="oldPassword"
                                name="oldPassword"
                                type="password" 
                                placeholder="Masukkan password lama"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <Input 
                                id="newPassword"
                                name="newPassword"
                                type="password" 
                                placeholder="Masukkan password baru"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                            <Input 
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password" 
                                placeholder="Ketik ulang password baru"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Menyimpan..." : (
                                <span className="flex items-center space-x-2">
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Password
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
    );
}
