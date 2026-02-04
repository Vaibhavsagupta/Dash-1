"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ClipboardCheck,
    Settings,
    FolderOpen,
    LogOut,
    GraduationCap,
    BarChart3,
    TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { name: 'Batch Analytics', icon: LayoutDashboard, path: '/admin/batch-analytics' },
    { name: 'Progression', icon: TrendingUp, path: '/admin/progression' },
    { name: 'Students', icon: Users, path: '/admin/manage' },
    { name: 'Teachers', icon: GraduationCap, path: '/admin/manage_teachers' },
    { name: 'Approvals', icon: ClipboardCheck, path: '/admin/approvals' },
    { name: 'Dataset Uploads', icon: FolderOpen, path: '/admin/ingestion' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-[#1e293b] border-r border-slate-700 z-50 flex-col">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard className="text-white" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Admin CMS</h2>
                </div>

                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-indigo-400'} />
                                <span className="font-medium">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-slate-700/50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
