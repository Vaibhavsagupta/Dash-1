"use client";
import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer id="contact" className="bg-[#0f172a] pt-24 pb-12 border-t border-slate-800/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-8 group">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                <span className="text-white font-black text-xl">D</span>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white">DASH<span className="text-indigo-500">2</span></span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed mb-8 pr-4">
                            The intelligent analytics partner for the modern coaching institute. Empowering educators with data.
                        </p>
                        <div className="flex gap-4">
                            {[Twitter, Linkedin, Github].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-600/10 transition-all">
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Product</h4>
                        <ul className="space-y-4">
                            {['Features', 'AI Prediction', 'Reporting', 'Pricing', 'Demo'].map(link => (
                                <li key={link}>
                                    <a href={`#${link.toLowerCase()}`} className="text-slate-400 hover:text-indigo-400 transition-colors">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Company</h4>
                        <ul className="space-y-4">
                            {['About Us', 'Success Stories', 'Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                                <li key={link}>
                                    <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Get In Touch</h4>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Email</p>
                                    <p className="text-slate-200">hello@performancesuite.in</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 shrink-0">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase mb-1">Support</p>
                                    <p className="text-slate-200">+91 98765 43210</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-500 text-sm font-medium">
                        © 2026 DASH2 Performance Suite. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Privacy Policy</a>
                        <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
