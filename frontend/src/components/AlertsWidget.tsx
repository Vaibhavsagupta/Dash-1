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
            const res = await fetch(`${API_BASE_URL}/automation/alerts`);
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
            // Trigger the backend analysis
            await fetch(`${API_BASE_URL}/automation/run-checks`, { method: 'POST' });

            // Wait a bit for the background task to (likely) complete some work, then fetch
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
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 flex flex-col h-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertCircle className="text-yellow-400" />
                    Automated Risk Alerts
                </h2>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-all flex items-center gap-2 text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Run Analysis'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {alerts.length === 0 ? (
                    <div className="text-gray-400 text-center py-10">
                        No alerts generated. System is all clear!
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-sm transition-all hover:scale-[1.02]
                    ${alert.type === 'risk' ? 'bg-red-500/10 border-red-500/30' :
                                    alert.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                                        'bg-blue-500/10 border-blue-500/30'}`}
                        >
                            <div className="mt-1">
                                {alert.type === 'risk' && <AlertCircle className="w-5 h-5 text-red-400" />}
                                {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                                {alert.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                            </div>
                            <div>
                                <p className="text-gray-200 text-sm font-medium">{alert.message}</p>
                                <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
