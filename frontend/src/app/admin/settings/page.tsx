"use client";
import React from 'react';
import { Settings, Shield, Bell, Database, Lock } from 'lucide-react';

import { API_BASE_URL } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        two_factor_auth: false,
        session_timeout: true,
        registration_alerts: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSetting = async (key: string) => {
        const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
        setSettings(newSettings); // Optimistic update

        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSettings)
            });
        } catch (err) {
            console.error(err);
            // Revert if failed
            setSettings(settings);
        }
    };

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handlePurge = async () => {
        if (!confirm("Are you sure you want to purge the system cache? This might affect real-time stats momentarily.")) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/purge-cache`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("System cache purged successfully.");
            }
        } catch (err) {
            console.error("Purge failed", err);
        }
    };

    return (
        <div className="text-slate-100">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
                <p className="text-slate-400">Configure global parameters and administrative controls.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-indigo-400" /> General Security
                    </h2>
                    <div className="space-y-6">
                        <SettingItem
                            label="Two-Factor Authentication"
                            description="Enforce 2FA for all administrative accounts."
                            enabled={settings.two_factor_auth}
                            onToggle={() => toggleSetting('two_factor_auth')}
                        />
                        <SettingItem
                            label="Login Session Timeout"
                            description="Automatically log out users after 60 minutes of inactivity."
                            enabled={settings.session_timeout}
                            onToggle={() => toggleSetting('session_timeout')}
                        />
                        <SettingItem
                            label="New Registration Alerts"
                            description="Notify super-admins via email when a new teacher or admin registers."
                            enabled={settings.registration_alerts}
                            onToggle={() => toggleSetting('registration_alerts')}
                        />
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/20">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Database size={20} className="text-sky-400" /> Backup & Data
                    </h2>
                    <div className="space-y-4">
                        <button
                            onClick={handleExport}
                            className="w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold">Export Full Database</div>
                                <div className="text-sm text-slate-400">Download a JSON snapshot of all system data</div>
                            </div>
                            <Database size={20} className="text-slate-500 group-hover:text-white" />
                        </button>
                        <button
                            onClick={handlePurge}
                            className="w-full text-left p-4 rounded-xl bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 transition-colors flex justify-between items-center group text-red-400"
                        >
                            <div>
                                <div className="font-bold">Purge System Cache</div>
                                <div className="text-sm text-red-900/60">Reset all real-time analytics calculations</div>
                            </div>
                            <Lock size={20} className="opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingItem({ label, description, enabled, onToggle }: { label: string, description: string, enabled: boolean, onToggle: () => void }) {
    return (
        <div className="flex justify-between items-center py-2">
            <div>
                <div className="font-bold text-slate-100">{label}</div>
                <div className="text-sm text-slate-400">{description}</div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}
