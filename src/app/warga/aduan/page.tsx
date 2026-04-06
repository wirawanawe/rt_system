"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MessageSquare, Clock, CheckCircle2, Loader2, Camera } from "lucide-react";

export default function AduanPage() {
    const { toast } = useToast();
    const [formData, setFormData] = useState({ judul: "", isi: "", lampiran: null as File | null });
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
        // Tandai semua balasan sebagai sudah dibaca saat halaman dibuka
        fetch("/api/aduan", { method: "PATCH" }).catch(console.error);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/aduan");
            if (res.ok) setHistory(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.judul.trim() || !formData.isi.trim()) return;
        setLoading(true);

        const data = new FormData();
        data.append("judul", formData.judul);
        data.append("isi", formData.isi);
        if (formData.lampiran) {
            data.append("lampiran", formData.lampiran);
        }

        try {
            const res = await fetch("/api/aduan", {
                method: "POST",
                body: data,
            });
            if (res.ok) {
                toast({ title: "Berhasil", description: "Aduan berhasil dikirim ke pengurus" });
                setFormData({ judul: "", isi: "", lampiran: null });
                fetchHistory();
            } else {
                const err = await res.json();
                toast({ title: "Gagal", description: err.error || "Terjadi kesalahan", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        pending: {
            label: "Menunggu",
            color: "bg-yellow-100 text-yellow-700 border-yellow-200",
            icon: <Clock className="w-3 h-3" />,
        },
        proses: {
            label: "Diproses",
            color: "bg-blue-100 text-blue-700 border-blue-200",
            icon: <Loader2 className="w-3 h-3" />,
        },
        selesai: {
            label: "Selesai",
            color: "bg-green-100 text-green-700 border-green-200",
            icon: <CheckCircle2 className="w-3 h-3" />,
        },
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            {/* Form Aduan */}
            <Card className="shadow-sm border-0 bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Kirim Aduan
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Sampaikan keluhan atau saran kepada pengurus RT.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Judul Aduan</Label>
                        <Input
                            className="mt-1"
                            placeholder="Contoh: Lampu jalan mati, Jalan rusak..."
                            value={formData.judul}
                            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Isi Aduan</Label>
                        <Textarea
                            className="mt-1 min-h-[100px]"
                            placeholder="Jelaskan aduan Anda secara detail..."
                            value={formData.isi}
                            onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Foto Bukti (Opsional)</Label>
                        <div className="mt-1 flex items-center gap-3">
                            <label className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors shadow-sm shrink-0">
                                <Camera className="w-5 h-5" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setFormData({ ...formData, lampiran: e.target.files[0] });
                                        }
                                    }}
                                />
                            </label>
                            <div className="flex-1 text-sm text-gray-500 truncate">
                                {formData.lampiran ? formData.lampiran.name : "Ambil atau pilih foto..."}
                            </div>
                            {formData.lampiran && (
                                <button
                                    onClick={() => setFormData({ ...formData, lampiran: null })}
                                    className="text-red-500 hover:text-red-700 text-xs shrink-0"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                    </div>
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                        disabled={!formData.judul.trim() || !formData.isi.trim() || loading}
                    >
                        {loading ? "Mengirim..." : "Kirim Aduan"}
                    </Button>
                </CardContent>
            </Card>

            {/* Riwayat Aduan */}
            <div className="space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    Riwayat Aduan
                </h3>
                {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-xl border">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Belum ada aduan yang dikirim.</p>
                    </div>
                ) : (
                    history.map((item) => {
                        const cfg = statusConfig[item.status] || statusConfig.pending;
                        return (
                            <Card key={item.id} className="shadow-sm border-0 bg-white overflow-hidden">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-gray-800 leading-tight">{item.judul}</p>
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color} shrink-0`}>
                                            {cfg.icon}
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{item.isi}</p>
                                    {item.lampiran && (
                                        <div className="mt-2">
                                            <img
                                                src={item.lampiran}
                                                alt="Lampiran aduan"
                                                className="w-full max-h-48 object-cover rounded-md border"
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(item.tanggal_dibuat).toLocaleDateString("id-ID", {
                                            day: "numeric", month: "long", year: "numeric"
                                        })}
                                    </p>
                                    {item.balasan && (
                                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-blue-600 mb-1">Balasan Pengurus:</p>
                                            <p className="text-sm text-blue-800">{item.balasan}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
