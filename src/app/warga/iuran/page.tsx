"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

type Iuran = {
    id: number;
    bulan: string;
    tahun: number;
    nominal: string;
    status_bayar: 'pending' | 'lunas' | 'rejected';
    tanggal_bayar: string;
};

export default function WargaIuran() {
    const [history, setHistory] = useState<Iuran[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [nominalIuran, setNominalIuran] = useState(0);
    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const [form, setForm] = useState({
        bulan: months[new Date().getMonth()], // Default current month
        tahun: new Date().getFullYear(),
        jml_bulan: 1,
        bukti: null as File | null
    });

    useEffect(() => {
        fetchHistory();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setNominalIuran(Number(data.nominal_iuran) || 0);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/iuran");
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("bulan", form.bulan);
            formData.append("tahun", form.tahun.toString());
            formData.append("jml_bulan", form.jml_bulan.toString());
            formData.append("nominal", nominalIuran.toString()); // Base nominal per month
            if (form.bukti) {
                formData.append("bukti_bayar", form.bukti);
            }

            const res = await fetch("/api/iuran", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast({ title: "Berhasil", description: "Bukti pembayaran dikirim" });
                setForm({ ...form, bukti: null, jml_bulan: 1 }); // Reset file input
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                fetchHistory();
            } else {
                const err = await res.json();
                throw new Error(err.error || "Gagal kirim");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const totalBayar = nominalIuran * form.jml_bulan;

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h3 className="font-bold text-lg">Bayar Iuran</h3>
                    <form onSubmit={handleUpload} className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Mulai Bulan</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={form.bulan}
                                    onChange={(e) => setForm({ ...form, bulan: e.target.value })}
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Tahun</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={form.tahun}
                                    onChange={(e) => setForm({ ...form, tahun: parseInt(e.target.value) })}
                                >
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Jumlah Bulan</Label>
                            <Input
                                type="number"
                                min={1}
                                max={12}
                                value={form.jml_bulan}
                                onChange={(e) => setForm({ ...form, jml_bulan: parseInt(e.target.value) || 1 })}
                            />
                        </div>

                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Iuran per Bulan:</span>
                                <span>Rp {nominalIuran.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total Bayar:</span>
                                <span className="text-blue-600">Rp {totalBayar.toLocaleString('id-ID')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Pembayaran untuk {form.jml_bulan} bulan mulai {form.bulan} {form.tahun}.
                            </p>
                        </div>

                        <div>
                            <Label>Bukti Transfer</Label>
                            <Input type="file" onChange={(e) => setForm({ ...form, bukti: e.target.files?.[0] || null })} />
                            <p className="text-xs text-gray-500 mt-1">*Upload foto/screenshot</p>
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || nominalIuran === 0}>
                            {loading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div>
                <h3 className="font-semibold text-gray-700 mb-3">Riwayat Pembayaran</h3>
                <div className="space-y-3">
                    {history.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-gray-800">{item.bulan} {item.tahun}</p>
                                <p className="text-xs text-gray-500">{new Date(item.tanggal_bayar).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-sm">Rp {Number(item.nominal).toLocaleString('id-ID')}</p>
                                <Badge variant={item.status_bayar === 'lunas' ? 'default' : item.status_bayar === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] scale-90 origin-right">
                                    {item.status_bayar}
                                </Badge>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-gray-400 text-sm">Belum ada riwayat.</p>}
                </div>
            </div>
        </div>
    );
}
