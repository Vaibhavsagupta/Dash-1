"use client";
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AIChatbot from './AIChatbot';
import {
    Home,
    LayoutDashboard,
    BarChart3,
    TrendingUp,
    Calendar,
    LogOut,
    Menu,
    X,
    Users,
    BookOpen,
    GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Get user role for dynamic routing
        const role = localStorage.getItem('user_role');
        setUserRole(role);

        const fetchPendingCount = async () => {
            if (role !== 'admin') return;
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const res = await fetch(`${API_BASE_URL}/admin/pending-approvals`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null);

                if (res && res.ok) {
                    const data = await res.json().catch(() => []);
                    if (Array.isArray(data)) {
                        setPendingCount(data.length);
                    }
                }
            } catch (err) {
                // Ignore network errors silently
            }
        };

        if (role === 'admin') {
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 30000);
            return () => {
                window.removeEventListener('scroll', handleScroll);
                clearInterval(interval);
            };
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Do not show on login/signup
    if (['/login', '/signup'].includes(pathname)) return null;

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    const getDashboardLink = () => {
        if (userRole === 'admin') return '/admin/dashboard';
        if (userRole === 'teacher') return '/teacher/dashboard';
        if (userRole === 'student') return '/student/dashboard';
        return '/login';
    };

    const navLinks = [
        { name: 'Dashboard', path: getDashboardLink(), icon: LayoutDashboard },
        { name: 'Batch Analysis', path: '/admin/batch-analytics', icon: BarChart3, role: 'admin' },
        { name: 'Student Progression', path: '/admin/progression', icon: TrendingUp, role: 'admin' },
        { name: 'Training Agenda', path: '/agenda', icon: Calendar },
        // Mobile-only Admin Links (Sidebar replacements)
        { name: 'Manage Students', path: '/admin/manage', icon: LayoutDashboard, role: 'admin', mobileOnly: true },
        { name: 'Manage Teachers', path: '/admin/manage_teachers', icon: LayoutDashboard, role: 'admin', mobileOnly: true },
        { name: 'Approvals', path: '/admin/approvals', icon: LayoutDashboard, role: 'admin', mobileOnly: true },
        { name: 'Data Ingestion', path: '/admin/ingestion', icon: LayoutDashboard, role: 'admin', mobileOnly: true },
        { name: 'Settings', path: '/admin/settings', icon: LayoutDashboard, role: 'admin', mobileOnly: true },

        // Mobile-only Teacher Links (Sidebar replacements)
        { name: 'Attendance', path: '/teacher/attendance', icon: Users, role: 'teacher', mobileOnly: true },
        { name: 'Assignments', path: '/teacher/assignments', icon: BarChart3, role: 'teacher', mobileOnly: true },
        { name: 'Progression', path: '/teacher/progression', icon: TrendingUp, role: 'teacher', mobileOnly: true },
        { name: 'Leaderboard', path: '/teacher/leaderboard', icon: TrendingUp, role: 'teacher', mobileOnly: true },
        { name: 'Manage Data', path: '/teacher/manage', icon: LayoutDashboard, role: 'teacher', mobileOnly: true },
        { name: 'My Tests', path: '/student/tests', icon: BookOpen, role: 'student' },
        { name: 'AI Tests', path: '/teacher/tests', icon: BookOpen, role: 'teacher', mobileOnly: true },
    ];

    // Filter links based on role
    const filteredLinks = navLinks.filter(link => !link.role || link.role === userRole);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white border-b border-slate-200 ${scrolled ? 'py-3 shadow-md' : 'py-4 shadow-sm'
            }`}>
            <div className="w-full px-6 md:px-8 flex items-center justify-between">
                {/* Logo in Far Left Corner */}
                <Link href={getDashboardLink()} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                        <GraduationCap className="text-white" size={22} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        SAGE <span className="text-indigo-600">University</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    {filteredLinks.filter(l => !l.mobileOnly).map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                href={link.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 relative z-10 group ${isActive ? 'text-white' : 'text-slate-700 hover:text-indigo-600'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-md shadow-indigo-600/30"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <link.icon size={16} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600 transition-colors'} />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        suppressHydrationWarning
                        onClick={handleLogout}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 hover:border-red-200 group"
                    >
                        <LogOut size={18} className="group-hover:rotate-12 transition-transform text-slate-500 group-hover:text-red-600" />
                        Logout
                    </button>

                    {/* Mobile Toggle */}
                    <button
                        suppressHydrationWarning
                        className="md:hidden p-2 text-slate-700 hover:text-indigo-600"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-slate-200 overflow-hidden shadow-xl"
                    >
                        <div className="px-6 py-8 flex flex-col gap-3">
                            {filteredLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 p-4 rounded-xl relative transition-all ${pathname === link.path
                                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                                        : 'bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100'
                                        }`}
                                >
                                    <link.icon size={20} />
                                    <span className="font-bold">{link.name}</span>
                                    {link.name === 'Approvals' && pendingCount > 0 && (
                                        <div className="ml-auto flex items-center gap-2">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                            </div>
                                            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                {pendingCount}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                            <button
                                suppressHydrationWarning
                                onClick={handleLogout}
                                className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200 mt-2"
                            >
                                <LogOut size={20} />
                                <span className="font-bold">Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AIChatbot />
        </nav>
    );
}
