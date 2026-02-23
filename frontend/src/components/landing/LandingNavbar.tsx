"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '#' },
        { name: 'Features', href: '#features' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'About', href: '#about' },
        { name: 'Contact', href: '#contact' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/80 backdrop-blur-lg border-b border-slate-700/50 py-3' : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl">D</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">DASH<span className="text-indigo-500">2</span></span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors"
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        href="/login"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 group"
                    >
                        Sign In
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-slate-300 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-[#0f172a] border-b border-slate-800"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-lg font-semibold text-slate-300 hover:text-indigo-400"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold text-center"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
