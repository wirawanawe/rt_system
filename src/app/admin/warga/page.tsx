"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DownloadButton from "@/components/ui/download-button";

type Warga = {
    id: number;
    nama: string;
    nik: string;
    alamat: string;
    status_tinggal: string;
    role: string;
};

export default function ManageWarga() {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingWarga, setEditingWarga] = useState<Warga | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        nama: "",
        nik: "",
        password: "",
        alamat: "",
        status_tinggal: "tetap",
        role: "warga",
    });

    useEffect(() => {
        fetchWarga();
    }, []);

    const fetchWarga = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/warga");
            if (res.ok) {
                const data = await res.json();
                setWargaList(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingWarga ? "/api/warga" : "/api/warga";
            const method = editingWarga ? "PUT" : "POST";
            const body = editingWarga ? { ...formData, id: editingWarga.id } : formData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }

            toast({ title: "Success", description: "Data warga berhasil disimpan" });
            setIsOpen(false);
            resetForm();
            fetchWarga();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus data ini?")) return;
        try {
            const res = await fetch(`/api/warga?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Deleted", description: "Warga berhasil dihapus" });
                fetchWarga();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openEdit = (warga: Warga) => {
        setEditingWarga(warga);
        setFormData({
            nama: warga.nama,
            nik: warga.nik,
            password: "", // Password not retrieved for security
            alamat: warga.alamat,
            status_tinggal: warga.status_tinggal,
            role: warga.role,
        });
        setIsOpen(true);
    };

    const resetForm = () => {
        setEditingWarga(null);
        setFormData({
            nama: "",
            nik: "",
            password: "",
            alamat: "",
            status_tinggal: "tetap",
            role: "warga",
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manajemen Warga</h2>
                <div className="flex items-center gap-2">
                    <DownloadButton
                        data={wargaList}
                        filename="Data_Warga_RT"
                        label="Excel"
                    />
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Tambah Warga</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingWarga ? "Edit Warga" : "Tambah Warga Baru"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Nama Lengkap</Label>
                                    <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                                </div>
                                <div>
                                    <Label>NIK</Label>
                                    <Input value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} required />
                                </div>
                                {!editingWarga && (
                                    <div>
                                        <Label>Password</Label>
                                        <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                    </div>
                                )}
                                <div>
                                    <Label>Alamat</Label>
                                    <Input value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Status Tinggal</Label>
                                        <select
                                            className="w-full border rounded-md p-2 text-sm"
                                            value={formData.status_tinggal}
                                            onChange={(e) => setFormData({ ...formData, status_tinggal: e.target.value })}
                                        >
                                            <option value="tetap">Tetap</option>
                                            <option value="kontrak">Kontrak</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Role</Label>
                                        <select
                                            className="w-full border rounded-md p-2 text-sm"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="warga">Warga</option>
                                            <option value="pengurus">Pengurus</option>
                                        </select>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Menyimpan..." : "Simpan"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>NIK</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wargaList.map((warga) => (
                            <TableRow key={warga.id}>
                                <TableCell className="font-medium">{warga.nama}</TableCell>
                                <TableCell>{warga.nik}</TableCell>
                                <TableCell>{warga.alamat}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${warga.status_tinggal === 'tetap' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {warga.status_tinggal}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${warga.role === 'pengurus' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {warga.role}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(warga)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(warga.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {wargaList.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">Belum ada data warga</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
