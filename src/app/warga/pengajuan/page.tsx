"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function PengajuanPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        keperluan: "",
        keterangan: "",
    });
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/surat");
            if (res.ok) {
                setHistory(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/surat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jenis_surat: "Surat Pengantar",
                    ...formData
                })
            });

            if (res.ok) {
                toast({ title: "Berhasil", description: "Pengajuan berhasil dikirim" });
                setFormData({ keperluan: "", keterangan: "" });
                fetchHistory();
            } else {
                toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Buat Pengajuan Baru</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Nama Lengkap</Label>
                            <Input value={session?.user?.name || ""} disabled className="bg-gray-100" />
                        </div>
                        <div>
                            <Label>Keperluan</Label>
                            <Input
                                placeholder="Contoh: Pembuatan KTP, SKCK, Domisili"
                                value={formData.keperluan}
                                onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Keterangan Tambahan (Opsional)</Label>
                            <Textarea
                                placeholder="Catatan tambahan..."
                                value={formData.keterangan}
                                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleSubmit} className="w-full" disabled={!formData.keperluan || loading}>
                            {loading ? "Mengirim..." : "Kirim Permintaan"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Riwayat Permintaan</h3>
                {history.length === 0 ? (
                    <p className="text-gray-500 text-center">Belum ada permintaan.</p>
                ) : (
                    history.map((item) => (
                        <Card key={item.id} className="p-4 border shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{item.jenis_surat}</p>
                                    <p className="text-sm text-gray-600">{item.keperluan}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(item.tanggal_dibuat).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={item.status === 'approved' ? "default" : item.status === 'rejected' ? "destructive" : "secondary"}>
                                        {item.status === 'approved' ? 'DISETUJUI' : item.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                                    </Badge>
                                </div>
                            </div>
                            {item.status === 'approved' && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <span className="text-green-600 text-lg">✅</span>
                                        <div>
                                            <p className="text-sm font-semibold text-green-800">Dokumen siap diambil</p>
                                            <p className="text-xs text-green-700 mt-0.5">Silakan ambil dokumen Anda di Pengurus RT.</p>
                                            {item.nomor_surat && (
                                                <p className="text-xs text-green-600 mt-1 font-medium">No. Surat: {item.nomor_surat}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {item.status === 'rejected' && item.catatan && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-xs text-red-700">Alasan: {item.catatan}</p>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
