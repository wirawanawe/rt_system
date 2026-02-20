"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";

interface OrganizationSettings {
    id: number;
    nama_rt: string;
    logo: string;
    nominal_iuran: number;
    pic_name: string;
    pic_phone: string;
}

export default function PengaturanPage() {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrganizationSettings>();
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => res.json())
            .then((data) => {
                setValue("nama_rt", data.nama_rt);
                setValue("nominal_iuran", data.nominal_iuran);
                setValue("pic_name", data.pic_name);
                setValue("pic_phone", data.pic_phone);
                setLogoPreview(data.logo);
            })
            .catch((err) => toast.error("Gagal memuat pengaturan"));
    }, [setValue]);

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("nama_rt", data.nama_rt);
        formData.append("nominal_iuran", data.nominal_iuran.toString());
        formData.append("pic_name", data.pic_name);
        formData.append("pic_phone", data.pic_phone);

        if (data.logo[0]) {
            formData.append("logo", data.logo[0]);
        }

        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Gagal menyimpan");

            const result = await res.json();
            if (result.logo) {
                setLogoPreview(result.logo);
            }

            toast.success("Pengaturan berhasil disimpan");
            // Reload page to refresh sidebar
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
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pengaturan RT</h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Nama RT</label>
                            <input
                                {...register("nama_rt", { required: "Nama RT wajib diisi" })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.nama_rt && <p className="mt-1 text-xs text-red-500">{errors.nama_rt.message}</p>}
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Nominal Iuran (Rp)</label>
                            <input
                                type="number"
                                {...register("nominal_iuran", { required: "Nominal wajib diisi" })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Nama PIC</label>
                            <input
                                {...register("pic_name", { required: "Nama PIC wajib diisi" })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700">No. HP PIC (Format: 628...)</label>
                            <input
                                {...register("pic_phone", { required: "No. HP wajib diisi" })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Logo RT</label>
                            <div className="mt-2 flex items-center gap-x-4">
                                {logoPreview && (
                                    <img
                                        src={logoPreview}
                                        alt="Logo RT"
                                        className="h-16 w-16 rounded-full object-cover border border-gray-200"
                                    />
                                )}
                                <label className="cursor-pointer bg-white rounded-md border border-gray-300 py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                    <span className="flex items-center gap-2">
                                        <Upload className="w-4 h-4" />
                                        Upload Logo
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
