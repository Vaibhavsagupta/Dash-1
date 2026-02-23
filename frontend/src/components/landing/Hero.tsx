"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full opacity-50" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Trusted by 50+ Coaching Institutes</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-[1.1]"
                >
                    AI-Powered Student <br />
                    <span className="text-indigo-500 uppercase italic">Performance Suite.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    A smart analytics dashboard designed for coaching centers to track student performance, predict risks using AI, and improve results by 30%.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
                >
                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl shadow-indigo-500/25 w-full sm:w-auto justify-center"
                    >
                        Book a Free Demo
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button
                        className="group inline-flex items-center gap-3 bg-slate-800/50 text-white border border-slate-700 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all w-full sm:w-auto justify-center"
                    >
                        <Play size={24} className="fill-white" />
                        Watch Video
                    </button>
                </motion.div>

                {/* Dashboard Preview Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative max-w-6xl mx-auto"
                >
                    <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] -z-10" />
                    <div className="bg-slate-900 rounded-[2.5rem] p-4 border border-slate-800 shadow-2xl relative overflow-hidden group">
                        {/* Browser-like Header */}
                        <div className="flex items-center gap-2 mb-4 px-4 py-2 border-b border-slate-800/50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="mx-auto bg-slate-800/50 px-6 py-1 rounded-lg text-[10px] text-slate-500 font-mono">
                                dashboard.performancesuite.in/admin
                            </div>
                        </div>

                        {/* Mock UI Content */}
                        <div className="grid grid-cols-12 gap-4 p-2">
                            <div className="col-span-3 space-y-4">
                                <div className="h-40 bg-slate-800/40 rounded-2xl animate-pulse" />
                                <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse" />
                            </div>
                            <div className="col-span-9 space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-indigo-600/20 rounded-2xl border border-indigo-500/20 animate-pulse" />
                                    <div className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
                                    <div className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
                                </div>
                                <div className="h-[20rem] bg-slate-800/20 rounded-3xl border border-slate-700/30 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5" />
                                    <div className="text-slate-500 font-bold uppercase tracking-widest text-xs opacity-50">AI Analytics Interface Preview</div>
                                    {/* Fake Chart Lines */}
                                    <svg className="absolute bottom-0 left-0 w-full h-1/2 text-indigo-500/20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0 100 C 20 80, 40 90, 60 40 S 80 10, 100 30 L 100 100 Z" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Quality Badges */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 px-8 py-4 rounded-2xl shadow-2xl whitespace-nowrap hidden md:flex">
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                            <CheckCircle2 size={20} className="text-indigo-500" />
                            99.9% Prediction Accuracy
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                            <CheckCircle2 size={20} className="text-indigo-500" />
                            Real-time Sync
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                            <CheckCircle2 size={20} className="text-indigo-500" />
                            End-to-End Encryption
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
