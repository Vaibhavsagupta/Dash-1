"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

const testimonials = [
    {
        name: "Dr. Rajesh Kumar",
        role: "Director, Apex Coaching Academy",
        content: "DASH2 has completely transformed how we track our medical aspirants. The AI risk prediction is spot on—we've saved over 40 students from failing this year.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
    },
    {
        name: "Anjali Sharma",
        role: "Head Teacher, Ignite JEE Main",
        content: "The visualization of student progress is incredible. I can now pinpoint exactly where a batch is struggling in just two minutes. Best investment for our center.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali"
    },
    {
        name: "Vikram Singh",
        role: "CEO, Global EduGroup",
        content: "Scaling to 20+ centers was only possible because Dashboard-2 gave us the transparency we needed. The real-time analytics are a game-changer.",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 bg-[#0f172a] relative border-y border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                    <div className="max-w-2xl">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-indigo-500 font-black uppercase tracking-[0.2em] text-sm mb-4"
                        >
                            Testimonials
                        </motion.h2>
                        <motion.h3
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-white tracking-tight"
                        >
                            Loved by educators across <br />
                            <span className="text-slate-500 italic font-medium">the entire nation.</span>
                        </motion.h3>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-6"
                    >
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-yellow-500 text-yellow-500" />)}
                            </div>
                            <div className="text-sm font-bold text-white">5.0/5 Score</div>
                            <div className="text-xs text-slate-500 font-medium">From 200+ Reviews</div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 z-10 group-hover:scale-110 transition-transform">
                                <Quote className="text-white w-6 h-6" />
                            </div>
                            <div className="bg-slate-950/50 border border-slate-800/80 p-10 rounded-[2.5rem] h-full flex flex-col justify-between group-hover:bg-slate-900/50 transition-colors">
                                <p className="text-lg text-slate-300 leading-relaxed mb-8 italic">
                                    "{t.content}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 overflow-hidden">
                                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-black text-white">{t.name}</div>
                                        <div className="text-sm text-slate-500 font-bold">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
