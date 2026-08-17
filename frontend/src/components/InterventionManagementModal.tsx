"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    X,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Plus,
    Filter,
    UserCheck
} from 'lucide-react';

interface InterventionManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InterventionManagementModal({ isOpen, onClose }: InterventionManagementModalProps) {
    const [interventions, setInterventions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        if (isOpen) {
            fetchInterventions();
        }
    }, [isOpen, filterStatus]);

    const fetchInterventions = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            let url = `${API_BASE_URL}/analytics/interventions/list`;
            if (filterStatus !== 'ALL') {
                url += `?status=${filterStatus}`;
            }

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setInterventions(data.interventions || []);
            }
        } catch (err) {
            console.error("Error fetching interventions:", err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/interventions/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                fetchInterventions();
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-indigo-950 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow border border-indigo-400/30">
                            <ShieldAlert size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold">Academic Intervention Management System</h2>
                            <p className="text-xs text-indigo-300">Track and manage student remediation & advisory lifecycles</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300">
                        <X size={18} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex gap-2">
                        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    filterStatus === status
                                        ? 'bg-indigo-600 text-white shadow'
                                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                                }`}
                            >
                                {status === 'ALL' ? 'All Interventions' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs font-extrabold text-slate-500">{interventions.length} Records</span>
                </div>

                {/* Content List */}
                <div className="p-6 flex-1 overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Loading Intervention System Logs...
                        </div>
                    ) : interventions.length > 0 ? (
                        interventions.map(inv => (
                            <div key={inv.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">{inv.student_name}</span>
                                        <span className="text-xs font-mono text-slate-400">({inv.student_id})</span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                                            {inv.intervention_type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium mt-1">{inv.notes || 'Routine academic monitoring intervention.'}</p>
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 block">Logged on {inv.created_at}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {inv.status === 'PENDING' && (
                                        <button 
                                            onClick={() => updateStatus(inv.id, 'IN_PROGRESS')}
                                            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow transition"
                                        >
                                            Mark In Progress →
                                        </button>
                                    )}
                                    {inv.status === 'IN_PROGRESS' && (
                                        <button 
                                            onClick={() => updateStatus(inv.id, 'COMPLETED')}
                                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                                        >
                                            Mark Completed ✓
                                        </button>
                                    )}
                                    {inv.status === 'COMPLETED' && (
                                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1 border border-emerald-200">
                                            <CheckCircle2 size={14} /> Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                            No interventions matching this filter status.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
