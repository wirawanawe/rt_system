"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { AlertCircle, MessageSquare, Clock, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

export default function AdminAduanPage() {
    const { toast } = useToast();
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ status: "", balasan: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/aduan");
            if (res.ok) setList(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (item: any) => {
        setSelected(item);
        setFormData({ status: item.status, balasan: item.balasan || "" });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await fetch("/api/aduan", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selected.id,
                    status: formData.status,
                    balasan: formData.balasan,
                }),
            });
            if (res.ok) {
                toast({ title: "Berhasil", description: "Aduan berhasil diperbarui" });
                setDialogOpen(false);
                fetchData();
            } else {
                toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
        pending: { label: "Menunggu", variant: "secondary", icon: <Clock className="w-3 h-3" /> },
        proses: { label: "Diproses", variant: "default", icon: <Loader2 className="w-3 h-3" /> },
        selesai: { label: "Selesai", variant: "outline", icon: <CheckCircle2 className="w-3 h-3" /> },
    };

    const counts = {
        pending: list.filter(i => i.status === "pending").length,
        proses: list.filter(i => i.status === "proses").length,
        selesai: list.filter(i => i.status === "selesai").length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Aduan Warga</h2>
                    <p className="text-sm text-gray-500 mt-1">Kelola dan tanggapi aduan dari warga RT</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-700">Menunggu</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">{counts.pending}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Loader2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">Diproses</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{counts.proses}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-700">Selesai</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{counts.selesai}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead>Warga</TableHead>
                            <TableHead>Judul Aduan</TableHead>
                            <TableHead>Isi</TableHead>
                            <TableHead>Lampiran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && list.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-gray-400">Belum ada aduan masuk</p>
                                </TableCell>
                            </TableRow>
                        )}
                        {list.map((item) => {
                            const cfg = statusConfig[item.status] || statusConfig.pending;
                            return (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="font-medium text-sm">{item.nama}</div>
                                        {item.alamat && (
                                            <div className="text-xs text-gray-400 truncate max-w-[120px]">{item.alamat}</div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium max-w-[180px] truncate">{item.judul}</TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <p className="text-sm text-gray-600 truncate">{item.isi}</p>
                                        {item.balasan && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <MessageSquare className="w-3 h-3 text-blue-400" />
                                                <p className="text-xs text-blue-500 truncate">{item.balasan}</p>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.lampiran ? (
                                            <a href={item.lampiran} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                                                Lihat File
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(item.tanggal_dibuat).toLocaleDateString("id-ID", {
                                            day: "numeric", month: "short", year: "numeric"
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit">
                                            {cfg.icon}
                                            {cfg.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openDialog(item)}
                                        >
                                            Tanggapi
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog Tanggapi */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                            Tanggapi Aduan
                        </DialogTitle>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Dari {selected.nama}</p>
                                <p className="font-semibold text-gray-800">{selected.judul}</p>
                                <p className="text-sm text-gray-600">{selected.isi}</p>
                                {selected.lampiran && (
                                    <div className="mt-2">
                                        <img
                                            src={selected.lampiran}
                                            alt="Lampiran aduan"
                                            className="w-full max-h-48 object-cover rounded-md border"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Ubah Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Menunggu</SelectItem>
                                        <SelectItem value="proses">Diproses</SelectItem>
                                        <SelectItem value="selesai">Selesai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Balasan / Tindak Lanjut</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    placeholder="Tulis balasan atau keterangan tindak lanjut..."
                                    value={formData.balasan}
                                    onChange={(e) => setFormData({ ...formData, balasan: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
