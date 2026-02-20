"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Check, X } from "lucide-react";

export default function AdminSuratPage() {
    const [list, setList] = useState<any[]>([]);
    const { toast } = useToast();
    const [selectedSurat, setSelectedSurat] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/surat");
            if (res.ok) setList(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (id: number, status: string) => {
        const nomor = status === 'approved' ? `${Math.floor(Math.random() * 1000)}/RT/2026` : null;
        try {
            const res = await fetch("/api/surat", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, nomor_surat: nomor })
            });
            if (res.ok) {
                toast({ title: "Updated", description: `Status diubah menjadi ${status}` });
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handlePrint = (item: any) => {
        setSelectedSurat(item);
        // In a real app, we might use a dedicated print component or route.
        // For simplicity, we assume this button opens a modal preview to print.
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Permintaan Surat</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Warga</TableHead>
                            <TableHead>Keperluan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {list.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.nama}</div>
                                    <div className="text-xs text-gray-500">{item.nik}</div>
                                </TableCell>
                                <TableCell>{item.keperluan}</TableCell>
                                <TableCell>{new Date(item.tanggal_dibuat).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'approved' ? "default" : item.status === 'rejected' ? "destructive" : "secondary"}>
                                        {item.status}
                                    </Badge>
                                    {item.status === 'approved' && (
                                        <div className="text-xs mt-1">{item.nomor_surat}</div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {item.status === 'pending' && (
                                        <>
                                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleUpdate(item.id, 'approved')}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdate(item.id, 'rejected')}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    {item.status === 'approved' && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="secondary" onClick={() => setSelectedSurat(item)}>
                                                    <Printer className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl bg-white p-8 overflow-auto max-h-screen">
                                                <PrintPreview data={item} />
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {list.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">Belum ada permintaan</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PrintPreview({ data }: { data: any }) {
    return (
        <div className="print-content text-black">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-xl font-bold uppercase">Rukun Tetangga 001 / RW 005</h1>
                <h2 className="text-lg font-bold uppercase">Kelurahan Sukamaju, Kecamatan Sukajaya</h2>
                <p className="text-sm mt-1">Sekretariat: Jl. Mawar No. 10, Kota Bandung, Jawa Barat</p>
            </div>

            <div className="text-center mb-6">
                <h3 className="text-lg font-bold underline">SURAT PENGANTAR</h3>
                <p>Nomor: {data.nomor_surat}</p>
            </div>

            <p className="mb-4">Yang bertanda tangan di bawah ini Ketua RT.001 / RW.005, menerangkan bahwa:</p>

            <table className="w-full mb-6">
                <tbody>
                    <tr>
                        <td className="w-40 py-1">Nama</td>
                        <td>: {data.nama}</td>
                    </tr>
                    <tr>
                        <td className="w-40 py-1">NIK</td>
                        <td>: {data.nik}</td>
                    </tr>
                    <tr>
                        <td className="w-40 py-1">Alamat</td>
                        <td>: Jl. Mawar No. 10 (Sesuai Data)</td>
                    </tr>
                </tbody>
            </table>

            <p className="mb-2">Adalah benar warga kami yang berdomisili di alamat tersebut di atas.</p>
            <p className="mb-6">Surat pengantar ini diberikan untuk keperluan: <strong>{data.keperluan}</strong>.</p>

            {data.keterangan && (
                <p className="mb-6">Keterangan: {data.keterangan}</p>
            )}

            <p className="mb-8">Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

            <div className="flex justify-end mt-12">
                <div className="text-center">
                    <p>Bandung, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="mt-2">Ketua RT 001</p>
                    <br /><br /><br />
                    <p className="font-bold underline">( Budi Santoso )</p>
                </div>
            </div>

            <div className="mt-8 flex justify-center print:hidden">
                <Button onClick={() => window.print()}>Cetak Sekarang</Button>
            </div>
        </div>
    )
}
