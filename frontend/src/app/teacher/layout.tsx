"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    LogOut,
    Menu,
    X,
    Database,
    TrendingUp,
    Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userName, setUserName] = useState("Teacher");

    useEffect(() => {
        // Quick auth check (detailed check in pages)
        const role = localStorage.getItem("user_role");
        if (role && role !== "teacher") {
            router.push("/login");
        }
        // Ideally fetch user details here if needed globally
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
                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Sidebar */}
                <AnimatePresence mode="wait">
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="fixed lg:sticky top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 shadow-2xl z-40 flex flex-col"
                        >
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
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className="flex-1 min-w-0 overflow-auto">
                    <div className="lg:p-8 p-4 mt-12 lg:mt-0">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
