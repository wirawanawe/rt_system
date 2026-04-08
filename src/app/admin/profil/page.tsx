"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export default function AdminProfil() {
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profil Admin</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="flex flex-col items-center py-8 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                            <User className="w-12 h-12" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{session.user?.name}</h2>
                        <p className="text-gray-500 text-sm mb-4">{session.user?.email}</p>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">
                            {session.user?.role}
                        </span>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Lock className="w-5 h-5" />
                                <span>Ganti Password</span>
                            </CardTitle>
                            <CardDescription>
                                Perbarui password Anda untuk menjaga keamanan akun.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
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
                </div>
            </div>
        </div>
    );
}
