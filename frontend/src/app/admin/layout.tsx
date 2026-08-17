"use client";
import AdminSidebar from "@/components/AdminSidebar";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (!token || (role || '').toLowerCase() !== 'admin') {
            console.warn('[AdminLayout] Unauthorized access attempt, redirecting to /login...');
            router.push('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flex bg-slate-50 min-h-screen pt-[72px]">
                <AdminSidebar />
                <main className="flex-1 p-4 md:ml-64 md:p-8 overflow-y-auto text-slate-900">
                    {children}
                </main>
            </div>
        </>
    );
}
