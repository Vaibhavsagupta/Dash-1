"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home,
    LayoutDashboard,
    BarChart3,
    TrendingUp,
    Calendar,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Get user role for dynamic routing
        const role = localStorage.getItem('user_role');
        setUserRole(role);

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
        { name: 'Home', path: '/', icon: Home },
        { name: 'Dashboard', path: getDashboardLink(), icon: LayoutDashboard },
        { name: 'Batch Analysis', path: '/admin/batch-analytics', icon: BarChart3, role: 'admin' },
        { name: 'Student Progression', path: '/admin/progression', icon: TrendingUp, role: 'admin' },
        { name: 'Training Agenda', path: '/agenda', icon: Calendar },
    ];

    // Filter links based on role if necessary, but request says "Global"
    const filteredLinks = navLinks.filter(link => !link.role || link.role === userRole);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/80 backdrop-blur-lg border-b border-slate-700/50 py-3 shadow-2xl' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div />

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-1 bg-slate-800/20 p-1 rounded-2xl border border-slate-700/30">
                    {filteredLinks.map((link) => {
                        const isActive = pathname === link.path;
                        return (
                            <Link
                                key={link.name}
                                href={link.path}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-indigo-600 rounded-xl -z-10 shadow-lg shadow-indigo-500/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <link.icon size={16} className={isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'} />
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                    >
                        <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                        Logout
                    </button>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white"
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
                        className="md:hidden bg-[#0f172a] border-b border-slate-800 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-4">
                            {filteredLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl ${pathname === link.path
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-800/30 text-slate-400'
                                        }`}
                                >
                                    <link.icon size={20} />
                                    <span className="font-semibold">{link.name}</span>
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500"
                            >
                                <LogOut size={20} />
                                <span className="font-semibold">Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
