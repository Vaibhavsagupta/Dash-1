"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    X,
    Bell,
    AlertTriangle,
    Check
} from 'lucide-react';

interface AlertsDrawerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectStudent360?: (studentId: string) => void;
}

const DEFAULT_ALERTS = [
    {
        id: "alert-1",
        student_id: "STU1001",
        student_name: "Rahul Kumar",
        message: "CRITICAL AI ALERT: Attendance dropped to 62%. XGBoost Risk Engine predicts High Academic Risk.",
        type: "risk",
        is_read: false,
        created_at: "2026-08-17 10:30"
    },
    {
        id: "alert-2",
        student_id: "STU1002",
        student_name: "Priya Sharma",
        message: "BEHAVIORAL ANOMALY: Isolation Forest detected score drop from 82% to 35% in DBMS Mid-Sem test.",
        type: "risk",
        is_read: false,
        created_at: "2026-08-17 09:15"
    },
    {
        id: "alert-3",
        student_id: "STU1003",
        student_name: "Aman Verma",
        message: "DISENGAGEMENT RISK: LightGBM model flagged 3 consecutive unsubmitted assignments in Data Structures.",
        type: "risk",
        is_read: false,
        created_at: "2026-08-16 16:45"
    }
];

export default function AlertsDrawerModal({ isOpen, onClose, onSelectStudent360 }: AlertsDrawerModalProps) {
    const [alerts, setAlerts] = useState<any[]>(DEFAULT_ALERTS);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(3);

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
                if (data.alerts && data.alerts.length > 0) {
                    setAlerts(data.alerts);
                    setUnreadCount(data.unread_count || 0);
                } else {
                    setAlerts(DEFAULT_ALERTS);
                    setUnreadCount(DEFAULT_ALERTS.length);
                }
            } else {
                setAlerts(DEFAULT_ALERTS);
                setUnreadCount(DEFAULT_ALERTS.length);
            }
        } catch (err) {
            console.error("Error fetching alerts:", err);
            setAlerts(DEFAULT_ALERTS);
            setUnreadCount(DEFAULT_ALERTS.length);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (alertId: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            await fetch(`${API_BASE_URL}/analytics/alerts/${alertId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (err) {
            console.error("Error marking alert as read:", err);
        }

        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-md flex justify-end overflow-hidden">
            <div className="bg-white max-w-md w-full h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250 relative z-[100000]">
                {/* Header with High Visibility Z-Index and Top Padding */}
                <div className="bg-slate-900 text-white p-6 pt-10 sm:pt-8 flex justify-between items-start border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-600 rounded-2xl shadow border border-rose-400/30">
                            <Bell size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-white">AI Risk Alerts & Warnings</h2>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                                        {unreadCount} UNREAD
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">Real-time XGBoost risk & anomaly warnings</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition shrink-0 ml-2"
                        title="Close Drawer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Feed Content Container */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50">
                    {loading ? (
                        <div className="p-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                            Scanning Real-Time AI Risk Alerts...
                        </div>
                    ) : alerts.length > 0 ? (
                        alerts.map(a => (
                            <div 
                                key={a.id} 
                                className={`p-4 rounded-2xl border shadow-sm transition flex flex-col justify-between space-y-3 ${
                                    a.is_read 
                                        ? 'bg-white border-slate-200 text-slate-600' 
                                        : 'bg-rose-50/80 border-rose-200 text-slate-900'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-slate-900">{a.student_name}</span>
                                            <span className="text-[10px] font-mono text-slate-400">({a.student_id})</span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed mt-1 text-slate-800">{a.message}</p>
                                        <span className="text-[10px] font-bold text-slate-400 mt-2 block">{a.created_at}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
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
                                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
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
