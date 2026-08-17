"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    X,
    Bell,
    AlertTriangle,
    CheckCircle2,
    Check,
    Clock,
    User
} from 'lucide-react';

interface AlertsDrawerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStudent360?: (studentId: string) => void;
}

export default function AlertsDrawerModal({ isOpen, onClose, onSelectStudent360 }: AlertsDrawerModalProps) {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchAlerts();
        }
    }, [isOpen]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/alerts/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error("Error fetching alerts:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (alertId: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const res = await fetch(`${API_BASE_URL}/analytics/alerts/${alertId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                fetchAlerts();
            }
        } catch (err) {
            console.error("Error marking alert as read:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
            <div className="bg-white max-w-md w-full h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-600 rounded-xl shadow">
                            <Bell size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold flex items-center gap-2">
                                AI Risk Alerts & Notifications
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                                        {unreadCount} UNREAD
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs text-slate-400">Real-time XGBoost risk & anomaly warnings</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300">
                        <X size={18} />
                    </button>
                </div>

                {/* Feed */}
                <div className="p-6 flex-1 overflow-y-auto space-y-3 bg-slate-50">
                    {loading ? (
                        <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Scanning Real-Time AI Alerts...
                        </div>
                    ) : alerts.length > 0 ? (
                        alerts.map(a => (
                            <div 
                                key={a.id} 
                                className={`p-4 rounded-2xl border shadow-sm transition flex flex-col justify-between space-y-3 ${
                                    a.is_read 
                                        ? 'bg-white border-slate-200 text-slate-600' 
                                        : 'bg-rose-50/70 border-rose-200 text-slate-900'
                                }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900">{a.student_name}</span>
                                            <span className="text-[10px] font-mono text-slate-400">({a.student_id})</span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed mt-1 text-slate-800">{a.message}</p>
                                        <span className="text-[10px] font-bold text-slate-400 mt-2 block">{a.created_at}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                                    {onSelectStudent360 && (
                                        <button
                                            onClick={() => {
                                                onSelectStudent360(a.student_id);
                                                onClose();
                                            }}
                                            className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                        >
                                            View 360° Profile →
                                        </button>
                                    )}

                                    {!a.is_read && (
                                        <button
                                            onClick={() => markAsRead(a.id)}
                                            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                                        >
                                            <Check size={12} /> Mark Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl bg-white">
                            No active AI alerts at this time.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
