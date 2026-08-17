"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    X,
    Users,
    TrendingUp,
    Award,
    AlertTriangle,
    BarChart3,
    ArrowRightLeft,
    CheckCircle2
} from 'lucide-react';

interface BatchComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BatchComparisonModal({ isOpen, onClose }: BatchComparisonModalProps) {
    const [batch1, setBatch1] = useState('A1');
    const [batch2, setBatch2] = useState('A2');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchComparison();
        }
    }, [isOpen, batch1, batch2]);

    const fetchComparison = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/batch/compare?batch1=${batch1}&batch2=${batch2}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error("Error fetching comparison:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow border border-purple-400/30">
                            <ArrowRightLeft size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold">Cohort & Batch Performance Comparison</h2>
                            <p className="text-xs text-purple-200">Side-by-side analysis of academic scores, risk distributions & topic mastery</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300">
                        <X size={18} />
                    </button>
                </div>

                {/* Batch Selection Controls */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                            <span className="text-slate-500">Batch 1:</span>
                            <select value={batch1} onChange={e => setBatch1(e.target.value)} className="bg-transparent text-indigo-600 font-extrabold focus:outline-none">
                                <option value="A1">Batch A1</option>
                                <option value="B1">Batch B1</option>
                                <option value="C1">Batch C1</option>
                            </select>
                        </div>

                        <span className="text-xs font-black text-slate-400 uppercase">VS</span>

                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                            <span className="text-slate-500">Batch 2:</span>
                            <select value={batch2} onChange={e => setBatch2(e.target.value)} className="bg-transparent text-purple-600 font-extrabold focus:outline-none">
                                <option value="A2">Batch A2</option>
                                <option value="B2">Batch B2</option>
                                <option value="C2">Batch C2</option>
                            </select>
                        </div>
                    </div>

                    {data?.comparison_delta && (
                        <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                            🏆 Lead: {data.comparison_delta.top_performing_batch} (+{data.comparison_delta.score_diff_pct}%)
                        </div>
                    )}
                </div>

                {/* Content Comparison */}
                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Computing Side-by-Side Batch Analytics...
                    </div>
                ) : (
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* Side-by-Side Metrics */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Batch 1 Card */}
                            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider">{data?.batch1_info?.name}</h3>
                                    <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                        {data?.batch1_info?.student_count} Students
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
                                        <div className="text-xl font-black text-indigo-700 mt-1">{data?.batch1_info?.avg_score_pct}%</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-indigo-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Attendance</span>
                                        <div className="text-xl font-black text-emerald-600 mt-1">{data?.batch1_info?.avg_attendance_pct}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Batch 2 Card */}
                            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-purple-900 uppercase tracking-wider">{data?.batch2_info?.name}</h3>
                                    <span className="text-xs font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                                        {data?.batch2_info?.student_count} Students
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-purple-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
                                        <div className="text-xl font-black text-purple-700 mt-1">{data?.batch2_info?.avg_score_pct}%</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-purple-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Attendance</span>
                                        <div className="text-xl font-black text-emerald-600 mt-1">{data?.batch2_info?.avg_attendance_pct}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Topic Mastery Comparison */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syllabus Topic Mastery Comparison</span>
                            <div className="space-y-3">
                                {data?.batch1_info?.topic_mastery?.map((t1: any, idx: number) => {
                                    const t2 = data?.batch2_info?.topic_mastery?.[idx] || { accuracy: 50 };
                                    return (
                                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                            <span className="text-xs font-bold text-slate-800">{t1.topic}</span>
                                            <div className="flex items-center gap-4 text-xs font-bold">
                                                <span className="text-indigo-600 font-extrabold">{data?.batch1_info?.name}: {t1.accuracy}%</span>
                                                <span className="text-slate-300">vs</span>
                                                <span className="text-purple-600 font-extrabold">{data?.batch2_info?.name}: {t2.accuracy}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
