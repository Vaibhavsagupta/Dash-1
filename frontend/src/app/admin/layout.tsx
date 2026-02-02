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

        if (!token || role !== 'admin') {
            router.push('/login');
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="flex bg-[#0f172a] min-h-screen pt-[72px]">
                <AdminSidebar />
                <main className="flex-1 ml-64 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </>
    );
}
