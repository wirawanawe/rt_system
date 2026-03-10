"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Check, X } from "lucide-react";

export default function AdminSuratPage() {
    const [list, setList] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const { toast } = useToast();
    const [selectedSurat, setSelectedSurat] = useState<any>(null);
    const [approveItem, setApproveItem] = useState<any>(null);
    const [nomorSurat, setNomorSurat] = useState("");

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/surat");
            if (res.ok) setList(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) setSettings(await res.json());
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (id: number, status: string, nomor?: string) => {
        try {
            const res = await fetch("/api/surat", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status, nomor_surat: nomor || null })
            });
            if (res.ok) {
                toast({ title: "Updated", description: `Status diubah menjadi ${status}` });
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = () => {
        if (!nomorSurat.trim()) {
            toast({ title: "Error", description: "Nomor surat wajib diisi", variant: "destructive" });
            return;
        }
        handleUpdate(approveItem.id, 'approved', nomorSurat.trim());
        setApproveItem(null);
        setNomorSurat("");
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
                                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => { setApproveItem(item); setNomorSurat(""); }}>
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdate(item.id, 'rejected')}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    {item.status === 'approved' && (
                                        <Button size="sm" variant="secondary" onClick={() => setSelectedSurat(item)}>
                                            <Printer className="w-4 h-4" />
                                        </Button>
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

            {/* Modal Input Nomor Surat */}
            {approveItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setApproveItem(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-1">Setujui Permintaan Surat</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {approveItem.nama} — {approveItem.keperluan}
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Surat</label>
                            <input
                                type="text"
                                value={nomorSurat}
                                onChange={(e) => setNomorSurat(e.target.value)}
                                placeholder="Contoh: 001/RT-010/III/2026"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleApprove()}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setApproveItem(null)}>Batal</Button>
                            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-1" /> Setujui
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Surat Preview */}
            {selectedSurat && (
                <PrintPreview data={selectedSurat} settings={settings} onClose={() => setSelectedSurat(null)} />
            )}
        </div>
    );
}

function PrintPreview({ data, settings, onClose }: { data: any; settings: any; onClose: () => void }) {
    const rtNumber = settings?.nama_rt || "001";
    const namaRTFull = `RUKUN TETANGGA ${rtNumber}`;
    const logoKop = settings?.logo_kop || settings?.logo || null;
    const ketuaRT = settings?.pic_name || "Ketua RT";
    const picStatus = settings?.pic_status || "Ketua";
    const rw = settings?.rw || "";
    const kelurahan = settings?.kelurahan || "";
    const kecamatan = settings?.kecamatan || "";
    const kota = settings?.kota || "";

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-800/90" onClick={onClose}>
            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex gap-2 z-50 print:hidden">
                <Button onClick={(e) => { e.stopPropagation(); window.print(); }} variant="secondary" className="px-6">
                    <Printer className="w-4 h-4 mr-2" /> Cetak
                </Button>
                <Button onClick={onClose} variant="destructive" className="px-4">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #surat-a4, #surat-a4 * { visibility: visible !important; }
                    #surat-a4 {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        padding: 20mm 25mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                        transform: none !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                }
            `}</style>

            {/* A4 Paper — scaled to fit viewport */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    transform: 'scale(0.7)',
                    transformOrigin: 'center center',
                }}
            >
                <div
                    id="surat-a4"
                    style={{
                        width: '210mm',
                        height: '297mm',
                        padding: '20mm 25mm',
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '12pt',
                        lineHeight: '1.6',
                        background: 'white',
                        color: 'black',
                        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
                        overflow: 'hidden',
                    }}
                >
                    {/* === KOP SURAT === */}
                    <div className="flex items-center gap-4" style={{ borderBottom: '3px solid black', paddingBottom: '12px', marginBottom: '24px' }}>
                        {logoKop && (
                            <img src={logoKop} alt="Logo" style={{ width: '100px', height: '100px', objectFit: 'contain', flexShrink: 0 }} />
                        )}
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '20pt', fontWeight: 'bold', letterSpacing: '2px', margin: 0 }}>{namaRTFull}</div>
                            {rw && kelurahan && (
                                <div style={{ fontSize: '11pt', margin: '2px 0' }}>RUKUN WARGA {rw} – KELURAHAN {kelurahan.toUpperCase()}</div>
                            )}
                            {kecamatan && kota && (
                                <div style={{ fontSize: '11pt', margin: '2px 0' }}>KECAMATAN {kecamatan.toUpperCase()} – {kota.toUpperCase()}</div>
                            )}
                        </div>
                    </div>

                    {/* === NOMOR & PERIHAL === */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '11pt' }}>
                        <div>
                            <p style={{ margin: '2px 0' }}>Nomor&nbsp;&nbsp;&nbsp;&nbsp;: {data.nomor_surat}</p>
                            <p style={{ margin: '2px 0' }}>Perihal&nbsp;&nbsp;&nbsp;: {data.keperluan}</p>
                        </div>
                        <div>
                            <p style={{ margin: '2px 0' }}>{new Date(data.tanggal_dibuat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* === JUDUL SURAT === */}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline' }}>SURAT PENGANTAR</div>
                    </div>

                    {/* === ISI SURAT === */}
                    <p style={{ marginBottom: '16px' }}>
                        Yang bertanda tangan di bawah ini, {picStatus} RT {rtNumber}, menerangkan bahwa:
                    </p>

                    <table style={{ width: '100%', marginBottom: '24px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '140px', padding: '2px 0', verticalAlign: 'top' }}>Nama</td>
                                <td style={{ verticalAlign: 'top' }}>: {data.nama}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top' }}>NIK</td>
                                <td style={{ verticalAlign: 'top' }}>: {data.nik}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '2px 0', verticalAlign: 'top' }}>Keperluan</td>
                                <td style={{ verticalAlign: 'top' }}>: {data.keperluan}</td>
                            </tr>
                            {data.keterangan && (
                                <tr>
                                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>Keterangan</td>
                                    <td style={{ verticalAlign: 'top' }}>: {data.keterangan}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <p style={{ marginBottom: '8px' }}>
                        Adalah benar warga kami yang berdomisili di lingkungan RT {rtNumber}.
                    </p>
                    <p style={{ marginBottom: '24px' }}>
                        Surat pengantar ini diberikan untuk keperluan: <strong>{data.keperluan}</strong>.
                    </p>

                    <p style={{ marginBottom: '32px' }}>
                        Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.
                    </p>

                    {/* === TANDA TANGAN === */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p>{picStatus} RT {rtNumber}</p>
                            <div style={{ height: '80px' }}></div>
                            <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{ketuaRT}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
