"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full opacity-60" />
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full opacity-40" />
            </div>

            <div className="max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-700">Trusted by 50+ Coaching Institutes</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 leading-[1.1]"
                >
                    AI-Powered Student <br />
                    <span className="text-indigo-600 uppercase italic">Performance Suite.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
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
                        className="group inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto justify-center"
                    >
                        Book a Free Demo
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button
                        className="group inline-flex items-center gap-3 bg-white text-slate-800 border border-slate-200 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all w-full sm:w-auto justify-center shadow-sm"
                    >
                        <Play size={24} className="fill-indigo-600 text-indigo-600" />
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
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] -z-10" />
                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-xl relative overflow-hidden group">
                        {/* Browser-like Header */}
                        <div className="flex items-center gap-2 mb-4 px-4 py-2 border-b border-slate-200">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>
                            <div className="mx-auto bg-slate-100 px-6 py-1 rounded-lg text-[10px] text-slate-500 font-mono">
                                dashboard.performancesuite.in/admin
                            </div>
                        </div>

                        {/* Mock UI Content */}
                        <div className="grid grid-cols-12 gap-4 p-2">
                            <div className="col-span-3 space-y-4">
                                <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
                                <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                            </div>
                            <div className="col-span-9 space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="h-32 bg-indigo-50 rounded-2xl border border-indigo-100 animate-pulse" />
                                    <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                                    <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
                                </div>
                                <div className="h-[20rem] bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                    <span className="text-slate-400 font-bold text-sm">Interactive Analytics Live Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
