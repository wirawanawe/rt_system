"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Mail,
    Settings,
    LogOut,
    Menu,
    X,
    AlertTriangle,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [settings, setSettings] = useState<any>({});
    const [stats, setStats] = useState({ pending_iuran: 0, pending_surat: 0, pending_warga: 0, pending_aduan: 0 });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated" && session?.user?.role !== "pengurus") {
            router.push("/warga");
        }
    }, [status, session, router]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };

        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        if (status === "authenticated") {
            fetchSettings();
            fetchStats();
            // Poll every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [status]);

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!session || session.user.role !== "pengurus") {
        return null;
    }

    const isActive = (path: string) => pathname === path ? "bg-blue-100 text-blue-600" : "";

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="h-16 flex items-center px-6 border-b">
                    {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="h-8 w-8 mr-2 object-contain" />
                    ) : (
                        <div className="h-8 w-8 bg-blue-600 rounded-lg mr-2 flex items-center justify-center text-white font-bold">
                            RT
                        </div>
                    )}
                    <span className="font-bold text-xl text-gray-800 truncate">{settings.app_title || "RT System"}</span>
                    <button
                        className="ml-auto lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    <Link href="/admin" className={`flex items-center space-x-3 p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin')}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/warga" className={`flex items-center justify-between p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/warga')}`}>
                        <div className="flex items-center space-x-3">
                            <Users className="w-5 h-5" />
                            <span>Data Warga</span>
                        </div>
                        {stats.pending_warga > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {stats.pending_warga}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/iuran" className={`flex items-center justify-between p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/iuran')}`}>
                        <div className="flex items-center space-x-3">
                            <CreditCard className="w-5 h-5" />
                            <span>Validasi Iuran</span>
                        </div>
                        {stats.pending_iuran > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {stats.pending_iuran}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/kas" className={`flex items-center space-x-3 p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/kas')}`}>
                        <CreditCard className="w-5 h-5" />
                        <span>Kas RT</span>
                    </Link>
                    <Link href="/admin/pengumuman" className={`flex items-center space-x-3 p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/pengumuman')}`}>
                        <FileText className="w-5 h-5" />
                        <span>Pengumuman</span>
                    </Link>
                    <Link href="/admin/surat" className={`flex items-center justify-between p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/surat')}`}>
                        <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5" />
                            <span>Surat Pengantar</span>
                        </div>
                        {stats.pending_surat > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {stats.pending_surat}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/aduan" className={`flex items-center justify-between p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/aduan')}`}>
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Aduan Warga</span>
                        </div>
                        {stats.pending_aduan > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {stats.pending_aduan}
                            </span>
                        )}
                    </Link>
                    <Link href="/admin/profil" className={`flex items-center space-x-3 p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/profil')}`}>
                        <User className="w-5 h-5" />
                        <span>Profil</span>
                    </Link>
                    <Link href="/admin/pengaturan" className={`flex items-center space-x-3 p-3 rounded-lg transition hover:bg-blue-50 hover:text-blue-600 ${isActive('/admin/pengaturan')}`}>
                        <Settings className="w-5 h-5" />
                        <span>Pengaturan</span>
                    </Link>
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t bg-white">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Keluar
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <div className="md:hidden mb-4">
                        <Button onClick={() => setSidebarOpen(true)} variant="outline" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
