"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    LogOut,
    Database,
    TrendingUp,
    Trophy
} from "lucide-react";
import { motion } from "framer-motion";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    // Removed isSidebarOpen state as we rely on Navbar for mobile nav

    useEffect(() => {
        const getCookie = (name: string) => {
            const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            return match ? match[2] : null;
        };

        const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || getCookie("access_token");
        const role = localStorage.getItem("user_role") || sessionStorage.getItem("user_role") || getCookie("user_role");

        if (!token || (role || '').toLowerCase() !== "teacher") {
            router.push("/login");
        } else {
            if (!localStorage.getItem('access_token') && token) localStorage.setItem('access_token', token);
            if (!localStorage.getItem('user_role') && role) localStorage.setItem('user_role', role);
        }
    }, [router]);

    const navItems = [
        { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: "/teacher/attendance", icon: Users },
        { name: "Assignments", href: "/teacher/assignments", icon: BookOpen },
        { name: "Progression", href: "/teacher/progression", icon: TrendingUp },
        { name: "Leaderboard", href: "/teacher/leaderboard", icon: Trophy },
        { name: "AI Tests", href: "/teacher/tests", icon: BookOpen },
        { name: "Manage Data", href: "/teacher/manage", icon: Database },
    ];

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 text-slate-900 flex pt-[72px]">
                {/* Sidebar (Desktop Only) */}
                <aside className="hidden lg:flex fixed top-[72px] bottom-0 w-64 bg-white border-r border-slate-200 shadow-sm z-40 flex-col overflow-y-auto">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            SAGE University
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Teacher Portal</p>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? "bg-indigo-50 text-indigo-600 font-semibold shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                >
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-200">
                        <button
                            suppressHydrationWarning
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 w-full lg:ml-64 p-4 lg:p-8 overflow-y-auto min-h-[calc(100vh-72px)]">
                    {children}
                </main>
            </div>
        </>
    );
}
