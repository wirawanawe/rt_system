"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DownloadButton from "@/components/ui/download-button";

type Iuran = {
    id: number;
    warga_id: number;
    nama_warga: string;
    bulan: string;
    tahun: number;
    nominal: string;
    status_bayar: 'pending' | 'lunas' | 'rejected';
    bukti_bayar: string | null;
    tanggal_bayar: string;
};

export default function ManageIuran() {
    const [iuranList, setIuranList] = useState<Iuran[]>([]);
    const [laporanList, setLaporanList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Laporan Filter
    const [bulan, setBulan] = useState(months[new Date().getMonth()]);
    const [tahun, setTahun] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchIuran();
    }, []);

    const fetchIuran = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/iuran");
            if (res.ok) {
                const data = await res.json();
                setIuranList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLaporan = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/iuran?mode=rekap&bulan=${bulan}&tahun=${tahun}`);
            if (res.ok) {
                const data = await res.json();
                setLaporanList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch laporan when tab or filter changes
    useEffect(() => {
        fetchLaporan();
    }, [bulan, tahun]);

    const updateStatus = async (id: number, status: 'lunas' | 'rejected') => {
        if (!confirm(`Ubah status menjadi ${status}?`)) return;

        try {
            const res = await fetch("/api/iuran", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status_bayar: status })
            });

            if (res.ok) {
                toast({ title: "Updated", description: `Status iuran berhasil diubah menjadi ${status}` });
                fetchIuran();
                fetchLaporan(); // Refresh laporan too
            } else {
                throw new Error("Failed to update");
            }
        } catch (error) {
            toast({ title: "Error", description: "Gagal update status", variant: "destructive" });
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Manajemen Iuran</h2>

            <Tabs defaultValue="validasi" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="validasi">Validasi Iuran Masuk</TabsTrigger>
                    <TabsTrigger value="laporan">Laporan Bulanan</TabsTrigger>
                </TabsList>

                <TabsContent value="validasi">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Warga</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead>Bukti</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {iuranList.map((iuran) => (
                                    <TableRow key={iuran.id}>
                                        <TableCell className="font-medium">{iuran.nama_warga}</TableCell>
                                        <TableCell>{iuran.bulan} {iuran.tahun}</TableCell>
                                        <TableCell>Rp {Number(iuran.nominal).toLocaleString('id-ID')}</TableCell>
                                        <TableCell>
                                            {iuran.bukti_bayar ? (
                                                <a
                                                    href={iuran.bukti_bayar}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline text-sm hover:text-blue-800"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Lihat Bukti
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Tidak ada</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={iuran.status_bayar === 'lunas' ? 'default' : iuran.status_bayar === 'rejected' ? 'destructive' : 'secondary'}>
                                                {iuran.status_bayar}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {iuran.status_bayar === 'pending' && (
                                                <>
                                                    <Button variant="outline" size="sm" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100" onClick={() => updateStatus(iuran.id, 'lunas')}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100" onClick={() => updateStatus(iuran.id, 'rejected')}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {iuranList.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">Belum ada iuran baru</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="laporan">
                    <div className="bg-white p-4 rounded-lg shadow mb-4 flex gap-4 items-end">
                        <div>
                            <label className="text-sm font-medium">Bulan</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={bulan}
                                onChange={(e) => setBulan(e.target.value)}
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tahun</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={tahun}
                                onChange={(e) => setTahun(parseInt(e.target.value))}
                            >
                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={fetchLaporan} disabled={loading}>Refresh</Button>
                        <DownloadButton
                            data={laporanList}
                            filename={`Laporan_Iuran_${bulan}_${tahun}`}
                            label="Excel"
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Warga</TableHead>
                                    <TableHead>Status Pembayaran</TableHead>
                                    <TableHead>Tanggal Bayar</TableHead>
                                    <TableHead>Nominal</TableHead>
                                    <TableHead>Bukti</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {laporanList.map((item) => (
                                    <TableRow key={item.warga_id}>
                                        <TableCell className="font-medium">{item.nama_warga}</TableCell>
                                        <TableCell>
                                            {item.status_bayar === 'lunas' ? (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Lunas</Badge>
                                            ) : item.status_bayar === 'pending' ? (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Menunggu</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-400 border-gray-200 bg-gray-50">Belum Bayar</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.tanggal_bayar ? new Date(item.tanggal_bayar).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {item.nominal ? `Rp ${Number(item.nominal).toLocaleString('id-ID')}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {item.bukti_bayar ? (
                                                <a
                                                    href={item.bukti_bayar}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline text-sm hover:text-blue-800"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Lihat
                                                </a>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {laporanList.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data warga</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div >
    );
}
