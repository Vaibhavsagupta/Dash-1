"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Brain,
    TrendingUp,
    Users,
    FileText,
    ShieldCheck,
    Zap,
    Target,
    ArrowRight
} from 'lucide-react';

const features = [
    {
        title: "Real-Time Analytics",
        description: "Track student performance across batches with live data visualization and drill-down metrics.",
        icon: BarChart3,
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        title: "AI Risk Prediction",
        description: "Our machine learning engine identifies students at risk of falling behind before it happens.",
        icon: Brain,
        color: "text-purple-500",
        bg: "bg-purple-500/10"
    },
    {
        title: "Trend Tracking",
        description: "Visualize progress over weeks and months to measure the effectiveness of your teaching strategies.",
        icon: TrendingUp,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        title: "Student Management",
        description: "Centralized database for student profiles, attendance, and comprehensive performance history.",
        icon: Users,
        color: "text-amber-500",
        bg: "bg-amber-500/10"
    },
    {
        title: "Automated Reporting",
        description: "Generate and export detailed PDF/Excel reports for parents and management in one click.",
        icon: FileText,
        color: "text-rose-500",
        bg: "bg-rose-500/10"
    },
    {
        title: "Role-Based Access",
        description: "Secure permissions for Admins, Teachers, and HR to ensure data privacy and integrity.",
        icon: ShieldCheck,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10"
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#0f172a] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-indigo-500 font-black uppercase tracking-[0.2em] text-sm mb-4"
                    >
                        Core Capabilities
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-white tracking-tight"
                    >
                        Everything you need to <br />
                        <span className="text-slate-500">scale your coaching center.</span>
                    </motion.h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group p-8 rounded-[2rem] bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-4 group-hover:text-indigo-400 transition-colors">
                                {feature.title}
                            </h4>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                {feature.description}
                            </p>
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                Learn More <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Aesthetic element */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full" />
        </section>
    );
}
