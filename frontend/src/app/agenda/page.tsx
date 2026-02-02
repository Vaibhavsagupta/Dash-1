"use client";
import React from 'react';
import Navbar from '@/components/Navbar';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';

export default function TrainingAgendaPage() {
    const agenda = [
        { time: '09:00 AM', title: 'Daily Standup', location: 'Hall A', instructor: 'Dr. Smith', type: 'Common' },
        { time: '10:30 AM', title: 'Advanced DSA Masterclass', location: 'Lab 2', instructor: 'Prof. Miller', type: 'Tech' },
        { time: '01:00 PM', title: 'Soft Skills Workshop', location: 'Conference Room', instructor: 'Coach Sarah', type: 'Soft Skill' },
        { time: '03:30 PM', title: 'Mock Interview Session', location: 'Virtual', instructor: 'Industry Expert', type: 'Review' },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100">
            <Navbar />
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-12">
                        <h1 className="text-4xl font-bold mb-3">Training Agenda</h1>
                        <p className="text-slate-400">Your daily schedule and learning milestones</p>
                    </header>

                    <div className="space-y-6">
                        {agenda.map((item, i) => (
                            <div key={i} className="glass p-6 rounded-3xl border border-slate-700 bg-slate-800/30 flex items-center gap-6 hover:border-indigo-500/50 transition-all group">
                                <div className="hidden md:flex flex-col items-center justify-center min-w-[100px] py-2 border-r border-slate-700">
                                    <Clock size={16} className="text-indigo-400 mb-1" />
                                    <span className="text-sm font-bold">{item.time.split(' ')[0]}</span>
                                    <span className="text-[10px] text-slate-500 uppercase">{item.time.split(' ')[1]}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${item.type === 'Tech' ? 'bg-blue-500/10 text-blue-400' :
                                                item.type === 'Soft Skill' ? 'bg-purple-500/10 text-purple-400' :
                                                    'bg-slate-700 text-slate-400'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold group-hover:text-indigo-400 transition-colors uppercase">{item.title}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase">
                                            <MapPin size={12} />
                                            {item.location}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase italic">
                                            Instructor: {item.instructor}
                                        </div>
                                    </div>
                                </div>
                                <button className="p-3 rounded-full bg-slate-700/50 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                    <CheckCircle size={24} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
