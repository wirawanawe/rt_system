import Link from "next/link";
import { Home, List, User, FileText, MessageCircle, AlertCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default async function WargaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const [rows] = await pool.query("SELECT * FROM organization_settings WHERE id = 1");
    // @ts-ignore
    const settings = rows[0] || { app_title: "RT System", nama_rt: "RT App", logo: null, pic_phone: "" };

    // Hitung aduan milik warga yang sudah dibalas tapi belum dibaca
    let aduanBalasan = 0;
    try {
        const [aduanRows]: any = await pool.query(
            "SELECT COUNT(*) as count FROM aduan WHERE warga_id = ? AND balasan IS NOT NULL AND balasan_dibaca = 0",
            [session!.user.id]
        );
        aduanBalasan = aduanRows[0].count;
    } catch (_) { }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
            <ServiceWorkerRegister />
            <header className="bg-white shadow-sm p-3 sticky top-0 z-10 flex items-center justify-center space-x-3">
                {settings.logo && (
                    <img src={settings.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                )}
                <h1 className="text-lg font-bold text-center text-blue-600 truncate max-w-[200px]">{settings.app_title || settings.nama_rt}</h1>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 relative">
                {children}

                {/* Floating WhatsApp Button */}
                {settings.pic_phone && (
                    <a
                        href={`https://wa.me/${settings.pic_phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fixed bottom-20 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition flex items-center justify-center z-50"
                        title="Chat dengan Pengurus"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </a>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-5 z-20">
                <Link href="/warga" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                    <Home className="w-6 h-6" />
                    <span className="text-xs mt-1">Beranda</span>
                </Link>
                <Link href="/warga/iuran" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                    <List className="w-6 h-6" />
                    <span className="text-xs mt-1">Iuran</span>
                </Link>
                <Link href="/warga/pengajuan" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                    <FileText className="w-6 h-6" />
                    <span className="text-xs mt-1">Pengajuan</span>
                </Link>
                <Link href="/warga/aduan" className="flex flex-col items-center text-gray-600 hover:text-blue-600 relative">
                    <div className="relative">
                        <AlertCircle className="w-6 h-6" />
                        {aduanBalasan > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {aduanBalasan > 9 ? "9+" : aduanBalasan}
                            </span>
                        )}
                    </div>
                    <span className="text-xs mt-1">Aduan</span>
                </Link>
                <Link href="/warga/profil" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
                    <User className="w-6 h-6" />
                    <span className="text-xs mt-1">Profil</span>
                </Link>
            </nav>
        </div>
    );
}
