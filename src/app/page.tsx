import Link from "next/link";
import { Users, Shield } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 tracking-tight">
                    Sistem Manajemen RT
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                    Platform digital untuk kemudahan administrasi dan transparansi lingkungan RT.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    {/* Warga Card */}
                    <Link href="/warga" className="group">
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center h-full">
                            <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Warga</h2>
                            <p className="text-gray-500">Akses pengumuman, bayar iuran, dan lihat profil.</p>
                        </div>
                    </Link>

                    {/* Pengurus Card */}
                    <Link href="/admin" className="group">
                        <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col items-center h-full">
                            <div className="bg-indigo-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                <Shield className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Pengurus</h2>
                            <p className="text-gray-500">Kelola data warga, validasi iuran, dan buat pengumuman.</p>
                        </div>
                    </Link>
                </div>

                <footer className="pt-16 text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Manajemen RT Digital.
                </footer>
            </div>
        </div>
    );
}
