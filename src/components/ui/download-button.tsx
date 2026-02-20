"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface DownloadButtonProps {
    data: any[];
    filename: string;
    sheetName?: string;
    label?: string;
    className?: string;
}

export default function DownloadButton({
    data,
    filename,
    sheetName = "Sheet1",
    label = "Download Excel",
    className
}: DownloadButtonProps) {

    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("Tidak ada data untuk diunduh");
            return;
        }

        // Create workbook and sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Add sheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Write file
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <Button
            variant="outline"
            className={`flex items-center gap-2 ${className}`}
            onClick={handleDownload}
        >
            <Download className="h-4 w-4" />
            {label}
        </Button>
    );
}
