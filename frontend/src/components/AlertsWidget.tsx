'use client';
import { API_BASE_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface Alert {
    id: string;
    message: string;
    type: 'risk' | 'info' | 'success';
    created_at: string;
}

export default function AlertsWidget() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/automation/alerts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            // Trigger the backend analysis
            await fetch(`${API_BASE_URL}/automation/run-checks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Wait a bit for the background task to complete some work, then fetch
            setTimeout(() => {
                fetchAlerts();
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error("Error triggering analysis", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col h-full shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="text-amber-500" />
                    Automated Risk Alerts
                </h2>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white transition-all flex items-center gap-2 text-xs font-semibold shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="text-slate-500 text-center py-10 text-sm font-medium">
                        No alerts generated. System is all clear!
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.01]
                    ${alert.type === 'risk' ? 'bg-amber-50 border-amber-200' :
                                    alert.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                                        'bg-indigo-50 border-indigo-200'}`}
                        >
                            <div className="mt-0.5">
                                {alert.type === 'risk' && <AlertCircle className="w-5 h-5 text-amber-600" />}
                                {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                                {alert.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
                            </div>
                            <div>
                                <p className="text-slate-800 text-sm font-semibold">{alert.message}</p>
                                <span className="text-xs text-slate-500 font-medium">{new Date(alert.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
