import { Users, AlertCircle, Wallet } from "lucide-react";
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getStats() {
    const [warga] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM warga WHERE role = "warga"');
    const [iuran] = await pool.query<RowDataPacket[]>('SELECT SUM(nominal) as total FROM iuran WHERE status_bayar = "lunas" AND MONTH(tanggal_bayar) = MONTH(CURRENT_DATE())');
    // Assuming reports are not yet implemented, using placeholder or maybe 'iuran pending'
    const [pending] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM iuran WHERE status_bayar = "pending"');

    return {
        totalWarga: warga[0].count,
        totalIuran: iuran[0].total || 0,
        pendingIuran: pending[0].count
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Dashboard Ringkasan</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Warga */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Warga</p>
                        <p className="text-2xl font-bold">{stats.totalWarga}</p>
                    </div>
                </div>

                {/* Total Iuran Bulan Ini */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-green-100 rounded-full text-green-600">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Iuran Bulan Ini</p>
                        <p className="text-2xl font-bold">Rp {Number(stats.totalIuran).toLocaleString('id-ID')}</p>
                    </div>
                </div>

                {/* Laporan / Pending */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-4 bg-yellow-100 rounded-full text-yellow-600">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Menunggu Validasi</p>
                        <p className="text-2xl font-bold">{stats.pendingIuran}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
