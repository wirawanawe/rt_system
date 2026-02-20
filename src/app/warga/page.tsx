"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

type Pengumuman = {
    id: number;
    judul: string;
    isi: string;
    lampiran: string | null;
    tanggal_dibuat: string;
};

export default function WargaHome() {
    const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPengumuman() {
            try {
                const res = await fetch("/api/pengumuman");
                if (res.ok) {
                    const data = await res.json();
                    setPengumumanList(data);
                }
            } catch (error) {
                console.error("Failed to fetch pengumuman", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPengumuman();
    }, []);

    return (
        <div className="space-y-4">
            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-6">
                <h2 className="text-lg font-bold">Selamat Datang PETIR!</h2>
                <p className="text-sm opacity-90">Simak informasi terbaru seputar lingkungan RT kita.</p>
            </div>

            <h3 className="text-md font-semibold text-gray-700">Pengumuman Terbaru</h3>

            {loading ? (
                <p className="text-center text-gray-500">Memuat info...</p>
            ) : pengumumanList.length > 0 ? (
                pengumumanList.map((item) => (
                    <Card key={item.id} className="shadow-sm border-gray-100">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-800">{item.judul}</CardTitle>
                                    <Badge variant="outline" className="text-[10px] mt-1">{new Date(item.tanggal_dibuat).toLocaleDateString()}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.isi}</p>
                            {item.lampiran && (
                                <div className="mt-4 pt-3 border-t">
                                    <Button variant="outline" size="sm" asChild className="w-full justify-start text-blue-600">
                                        <a href={item.lampiran} target="_blank">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Lihat Lampiran
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <p className="text-center text-gray-500 py-8">Belum ada pengumuman.</p>
            )}
        </div>
    );
}
