"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const getCookie = (name: string) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        };

        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || getCookie("access_token");
        const role = localStorage.getItem("user_role") || sessionStorage.getItem("user_role") || getCookie("user_role");

        if (!token || (role || '').toLowerCase() !== "student") {
            router.push("/login");
        } else {
            if (!localStorage.getItem('access_token') && token) localStorage.setItem('access_token', token);
            if (!localStorage.getItem('user_role') && role) localStorage.setItem('user_role', role);
        }
    }, [router]);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 text-slate-900 pt-[72px]">
                {children}
            </div>
        </>
    );
}
