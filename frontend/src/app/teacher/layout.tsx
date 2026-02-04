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
        // Quick auth check (detailed check in pages)
        const role = localStorage.getItem("user_role");
        if (role && role !== "teacher") {
            router.push("/login");
        }
    }, [router]);

    const navItems = [
        { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
        { name: "Attendance", href: "/teacher/attendance", icon: Users },
        { name: "Assignments", href: "/teacher/assignments", icon: BookOpen },
        { name: "Progression", href: "/teacher/progression", icon: TrendingUp },
        { name: "Leaderboard", href: "/teacher/leaderboard", icon: Trophy },
        { name: "Manage Data", href: "/teacher/manage", icon: Database },
    ];

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#0f172a] flex pt-[72px]">
                {/* Sidebar (Desktop Only) */}
                <aside className="hidden lg:flex fixed top-[72px] bottom-0 w-64 bg-slate-900 border-r border-slate-800 shadow-2xl z-40 flex-col overflow-y-auto">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            EduSpace
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
                                        ? "bg-cyan-500/10 text-cyan-400 font-semibold"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon size={20} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
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
