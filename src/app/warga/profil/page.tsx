"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

export default function WargaProfil() {
    const { data: session } = useSession();

    if (!session) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center py-6 bg-white rounded-xl shadow-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                    <User className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold">{session.user?.name}</h2>
                <p className="text-gray-500 text-sm">{session.user?.email}</p>
                {/* Note: In our auth logic, email field holds the NIK temporarily or we can fetch full details via API */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-md">Info Warga</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">NIK</span>
                        <span className="font-medium">{session.user?.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Role</span>
                        <span className="font-medium capitalize">{session.user?.role}</span>
                    </div>
                    {/* Additional details would require fetching from /api/warga?id=... */}
                </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
        </div>
    );
}
