"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import DownloadButton from "@/components/ui/download-button";

type Transaction = {
    id: number;
    type: 'pemasukan' | 'pengeluaran';
    nominal: string;
    keterangan: string;
    tanggal: string;
    sumber: 'manual' | 'iuran';
};

type Summary = {
    saldo: number;
    total_masuk: number;
    total_keluar: number;
};

export default function KasRT() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<Summary>({ saldo: 0, total_masuk: 0, total_keluar: 0 });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const [month, setMonth] = useState(new Date().getMonth()); // 0-11
    const [year, setYear] = useState(new Date().getFullYear());

    const [form, setForm] = useState({
        type: 'pemasukan',
        nominal: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = () => {
        fetchTransactions();
        fetchSummary();
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // API expects 1-12 for month
            const res = await fetch(`/api/kas?month=${month + 1}&year=${year}`);
            if (res.ok) setTransactions(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const res = await fetch(`/api/kas?mode=summary&month=${month + 1}&year=${year}`);
            if (res.ok) setSummary(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/kas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast({ title: "Sukses", description: "Transaksi berhasil ditambahkan" });
                setOpen(false);
                setForm({ type: 'pemasukan', nominal: '', keterangan: '' });
                fetchData();
            } else {
                throw new Error("Gagal menyimpan");
            }
        } catch (error) {
            toast({ title: "Error", description: "Gagal menyimpan transaksi", variant: "destructive" });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus transaksi ini?")) return;
        try {
            const res = await fetch(`/api/kas?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Deleted", description: "Transaksi dihapus" });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Kas RT</h2>

            {/* Filters */}
            <div className="flex gap-4 mb-4 bg-white p-4 rounded-lg shadow items-center">
                <div className="flex-1">
                    <Label>Bulan</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <Label>Tahun</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="flex items-end h-full pt-6 gap-2">
                    <Button variant="secondary" onClick={() => {
                        setMonth(new Date().getMonth());
                        setYear(new Date().getFullYear());
                    }}>Reset Hari Ini</Button>

                    <DownloadButton
                        data={transactions}
                        filename={`Kas_RT_${months[month]}_${year}`}
                        label="Excel"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Total (Semua)</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {summary.saldo.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Masuk ({months[month]} {year})</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">+ Rp {summary.total_masuk.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Keluar ({months[month]} {year})</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">- Rp {summary.total_keluar.toLocaleString('id-ID')}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Transaksi Manual</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Jenis Transaksi</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                >
                                    <option value="pemasukan">Pemasukan</option>
                                    <option value="pengeluaran">Pengeluaran</option>
                                </select>
                            </div>
                            <div>
                                <Label>Nominal (Rp)</Label>
                                <Input
                                    type="number"
                                    required
                                    value={form.nominal}
                                    onChange={(e) => setForm({ ...form, nominal: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Keterangan</Label>
                                <Input
                                    required
                                    value={form.keterangan}
                                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Simpan</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Nominal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell>{new Date(t.tanggal).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{t.keterangan}</span>
                                        <span className="text-xs text-gray-400 capitalize">{t.sumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={t.type === 'pemasukan' ? 'default' : 'destructive'} className={t.type === 'pemasukan' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                                        {t.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className={t.type === 'pemasukan' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {t.type === 'pemasukan' ? '+' : '-'} Rp {Number(t.nominal).toLocaleString('id-ID')}
                                </TableCell>
                                <TableCell className="text-right">
                                    {t.sumber === 'manual' && (
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(t.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Belum ada data transaksi</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
