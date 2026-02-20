"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Pengumuman = {
    id: number;
    judul: string;
    isi: string;
    lampiran: string | null;
    tanggal_dibuat: string;
};

export default function ManagePengumuman() {
    const [list, setList] = useState<Pengumuman[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [judul, setJudul] = useState("");
    const [isi, setIsi] = useState("");
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/pengumuman");
            if (res.ok) {
                const data = await res.json();
                setList(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("judul", judul);
            formData.append("isi", isi);
            if (file) {
                formData.append("lampiran", file);
            }

            const res = await fetch("/api/pengumuman", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed");

            toast({ title: "Success", description: "Pengumuman berhasil dibuat" });
            setIsOpen(false);
            setJudul("");
            setIsi("");
            setFile(null);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Gagal menyimpan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus pengumuman ini?")) return;
        try {
            const res = await fetch(`/api/pengumuman?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Deleted", description: "Pengumuman berhasil dihapus" });
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manajemen Pengumuman</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Buat Pengumuman</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buat Pengumuman Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Judul</Label>
                                <Input value={judul} onChange={(e) => setJudul(e.target.value)} required />
                            </div>
                            <div>
                                <Label>Isi Pengumuman</Label>
                                <Textarea
                                    value={isi}
                                    onChange={(e) => setIsi(e.target.value)}
                                    required
                                    className="h-32"
                                />
                            </div>
                            <div>
                                <Label>Lampiran (PDF/Gambar) - Opsional</Label>
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Judul</TableHead>
                            <TableHead>Isi Ringkas</TableHead>
                            <TableHead>Lampiran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.judul}</TableCell>
                                <TableCell className="max-w-md truncate">{item.isi}</TableCell>
                                <TableCell>
                                    {item.lampiran ? (
                                        <a href={item.lampiran} target="_blank" className="text-blue-600 hover:underline flex items-center">
                                            <FileText className="w-4 h-4 mr-1" /> Lihat
                                        </a>
                                    ) : "-"}
                                </TableCell>
                                <TableCell>{new Date(item.tanggal_dibuat).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {list.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Belum ada pengumuman</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
