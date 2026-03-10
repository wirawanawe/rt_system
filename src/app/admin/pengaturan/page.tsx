"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

interface OrganizationSettings {
    id: number;
    nama_rt: string;
    logo: string;
    logo_kop: string;
    nominal_iuran: number;
    pic_name: string;
    pic_phone: string;
    pic_status: string;
    provinsi: string;
    kota: string;
    kecamatan: string;
    kelurahan: string;
    rw: string;
    app_title: string;
}

export default function PengaturanPage() {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrganizationSettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoKopPreview, setLogoKopPreview] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setValue("nama_rt", data.nama_rt);
                setValue("nominal_iuran", data.nominal_iuran);
                setValue("pic_name", data.pic_name);
                setValue("pic_phone", data.pic_phone);
                setValue("pic_status", data.pic_status || "Ketua");
                setValue("provinsi", data.provinsi || "");
                setValue("kota", data.kota || "");
                setValue("kecamatan", data.kecamatan || "");
                setValue("kelurahan", data.kelurahan || "");
                setValue("rw", data.rw || "");
                setValue("app_title", data.app_title || "RT System");
                setLogoPreview(data.logo);
                if (data.logo_kop) setLogoKopPreview(data.logo_kop);
            })
            .catch(() => toast.error("Gagal memuat pengaturan"));
    }, [setValue]);

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("nama_rt", data.nama_rt);
        formData.append("nominal_iuran", data.nominal_iuran.toString());
        formData.append("pic_name", data.pic_name);
        formData.append("pic_phone", data.pic_phone);
        formData.append("pic_status", data.pic_status || "Ketua");
        formData.append("provinsi", data.provinsi || "");
        formData.append("kota", data.kota || "");
        formData.append("kecamatan", data.kecamatan || "");
        formData.append("kelurahan", data.kelurahan || "");
        formData.append("rw", data.rw || "");
        formData.append("app_title", data.app_title || "RT System");

        if (data.logo?.[0]) {
            formData.append("logo", data.logo[0]);
        }
        if (data.logo_kop?.[0]) {
            formData.append("logo_kop", data.logo_kop[0]);
        }

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Gagal menyimpan");

            const result = await res.json();
            if (result.logo) setLogoPreview(result.logo);
            if (result.logo_kop) setLogoKopPreview(result.logo_kop);

            toast.success("Pengaturan berhasil disimpan");
            window.location.reload();
        } catch (error) {
            toast.error("Gagal menyimpan pengaturan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleLogoKopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoKopPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengaturan RT</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* === IDENTITAS RT === */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Identitas RT</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Judul Aplikasi</label>
                                <input
                                    {...register("app_title")}
                                    className={inputClass}
                                    placeholder="Contoh: RT System"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">RT</label>
                                <input
                                    {...register("nama_rt", { required: "Nama RT wajib diisi" })}
                                    className={inputClass}
                                    placeholder="Contoh: 10"
                                />
                                {errors.nama_rt && <p className="mt-1 text-xs text-red-500">{errors.nama_rt.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">RW</label>
                                <input
                                    {...register("rw")}
                                    className={inputClass}
                                    placeholder="Contoh: 08"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kelurahan</label>
                                <input
                                    {...register("kelurahan")}
                                    className={inputClass}
                                    placeholder="Contoh: Cibabat"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kecamatan</label>
                                <input
                                    {...register("kecamatan")}
                                    className={inputClass}
                                    placeholder="Contoh: Cimahi Utara"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Kota / Kabupaten</label>
                                <input
                                    {...register("kota")}
                                    className={inputClass}
                                    placeholder="Contoh: Kota Cimahi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Provinsi</label>
                                <input
                                    {...register("provinsi")}
                                    className={inputClass}
                                    placeholder="Contoh: Jawa Barat"
                                />
                            </div>
                        </div>
                    </div>

                    {/* === IURAN === */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Iuran</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nominal Iuran (Rp)</label>
                                <input
                                    type="number"
                                    {...register("nominal_iuran", { required: "Nominal wajib diisi" })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* === PIC / KETUA RT === */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">PIC / Pengurus RT</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Pengurus RT</label>
                                <input
                                    {...register("pic_name", { required: "Nama PIC wajib diisi" })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    {...register("pic_status")}
                                    className={inputClass}
                                >
                                    <option value="Ketua">Ketua</option>
                                    <option value="PLT Ketua">PLT Ketua</option>
                                    <option value="Wakil Ketua">Wakil Ketua</option>
                                    <option value="Sekretaris">Sekretaris</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">No. HP PIC (Format: 628...)</label>
                                <input
                                    {...register("pic_phone", { required: "No. HP wajib diisi" })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* === LOGO === */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Logo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo RT (sidebar/header) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo RT (Header & Sidebar)</label>
                                <div className="flex items-center gap-x-4">
                                    {logoPreview && (
                                        <img src={logoPreview} alt="Logo RT" className="h-16 w-16 rounded-full object-cover border border-gray-200" />
                                    )}
                                    <label className="cursor-pointer bg-white rounded-md border border-gray-300 py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50">
                                        <span className="flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Upload Logo RT
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            {...register("logo")}
                                            onChange={(e) => {
                                                register("logo").onChange(e);
                                                handleLogoChange(e);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Logo KOP Surat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Logo KOP Surat</label>
                                <div className="flex items-center gap-x-4">
                                    {logoKopPreview && (
                                        <img src={logoKopPreview} alt="Logo KOP" className="h-16 w-16 object-contain border border-gray-200 rounded" />
                                    )}
                                    <label className="cursor-pointer bg-white rounded-md border border-gray-300 py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50">
                                        <span className="flex items-center gap-2">
                                            <Upload className="w-4 h-4" />
                                            Upload Logo KOP
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            {...register("logo_kop")}
                                            onChange={(e) => {
                                                register("logo_kop").onChange(e);
                                                handleLogoKopChange(e);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-5">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Menyimpan..." : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Simpan Pengaturan
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
