"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Settings, Shield, Bell, Database, Lock, TrendingUp, CheckCircle, AlertTriangle, RotateCcw, Save, Info } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RankingParam {
    enabled: boolean;
    weight: number;
    label: string;
}

interface RankingConfig {
    [key: string]: RankingParam;
}

// ─── Param colours & icons ────────────────────────────────────────────────────

const PARAM_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    dsa:        { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '💻' },
    ml:         { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icon: '🤖' },
    qa:         { color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', icon: '🧮' },
    projects:   { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: '🚀' },
    mock:       { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '🎤' },
    attendance: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '📅' },
};

const DEFAULT_CONFIG: RankingConfig = {
    dsa:        { enabled: true, weight: 20, label: 'DSA' },
    ml:         { enabled: true, weight: 20, label: 'Machine Learning' },
    qa:         { enabled: true, weight: 20, label: 'Quantitative Aptitude' },
    projects:   { enabled: true, weight: 20, label: 'Projects' },
    mock:       { enabled: true, weight: 10, label: 'Mock Interview' },
    attendance: { enabled: true, weight: 10, label: 'Attendance' },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
    // System settings
    const [settings, setSettings] = useState({
        two_factor_auth: false,
        session_timeout: true,
        registration_alerts: true
    });

    // Ranking config
    const [rankingConfig, setRankingConfig] = useState<RankingConfig>(DEFAULT_CONFIG);
    const [rankingSaving, setRankingSaving] = useState(false);
    const [rankingSaveStatus, setRankingSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [rankingError, setRankingError] = useState('');

    useEffect(() => {
        fetchSettings();
        fetchRankingConfig();
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
        } catch (err) { console.error(err); }
    };

    const fetchRankingConfig = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/ranking-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRankingConfig(data);
            }
        } catch (err) { console.error(err); }
    };

    const toggleSetting = async (key: string) => {
        const newSettings = { ...settings, [key]: !settings[key as keyof typeof settings] };
        setSettings(newSettings);
        try {
            const token = localStorage.getItem('access_token');
            await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newSettings)
            });
        } catch (err) {
            console.error(err);
            setSettings(settings);
        }
    };

    // ── Ranking config handlers ──────────────────────────────────────────────

    const totalWeight = Object.values(rankingConfig).reduce(
        (sum, p) => sum + (p.enabled ? p.weight : 0), 0
    );
    const isValid = Math.abs(totalWeight - 100) <= 0.5;

    const handleToggleParam = (key: string) => {
        setRankingConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
        setRankingSaveStatus('idle');
    };

    const handleWeightChange = (key: string, value: number) => {
        setRankingConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], weight: value }
        }));
        setRankingSaveStatus('idle');
        setRankingError('');
    };

    const handleReset = () => {
        setRankingConfig(DEFAULT_CONFIG);
        setRankingSaveStatus('idle');
        setRankingError('');
    };

    const handleSaveRanking = async () => {
        if (!isValid) {
            setRankingError(`Total weight must be exactly 100%. Currently: ${totalWeight.toFixed(1)}%`);
            return;
        }
        setRankingSaving(true);
        setRankingError('');
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/ranking-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ config: rankingConfig })
            });
            if (res.ok) {
                setRankingSaveStatus('success');
                setTimeout(() => setRankingSaveStatus('idle'), 3000);
            } else {
                const err = await res.json();
                setRankingError(err.detail || 'Save failed');
                setRankingSaveStatus('error');
            }
        } catch {
            setRankingError('Network error. Please try again.');
            setRankingSaveStatus('error');
        } finally {
            setRankingSaving(false);
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
        } catch (err) { console.error("Export failed", err); }
    };

    const handlePurge = async () => {
        if (!confirm("Are you sure you want to purge the system cache?")) return;
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/purge-cache`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) alert("System cache purged successfully.");
        } catch (err) { console.error("Purge failed", err); }
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Platform Settings</h1>
                <p className="text-slate-500 font-medium">Configure global parameters and administrative controls.</p>
            </header>

            {/* ── Ranking Configuration (full width, top) ── */}
            <div className="mb-8">
                <RankingConfigPanel
                    config={rankingConfig}
                    totalWeight={totalWeight}
                    isValid={isValid}
                    saving={rankingSaving}
                    saveStatus={rankingSaveStatus}
                    error={rankingError}
                    onToggle={handleToggleParam}
                    onWeightChange={handleWeightChange}
                    onReset={handleReset}
                    onSave={handleSaveRanking}
                />
            </div>

            {/* ── Security + Backup ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-indigo-600" /> General Security
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

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Database size={20} className="text-sky-600" /> Backup & Data
                    </h2>
                    <div className="space-y-4">
                        <button
                            onClick={handleExport}
                            className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors flex justify-between items-center group"
                        >
                            <div>
                                <div className="font-bold text-slate-900">Export Full Database</div>
                                <div className="text-sm text-slate-500">Download a JSON snapshot of all system data</div>
                            </div>
                            <Database size={20} className="text-slate-400 group-hover:text-indigo-600" />
                        </button>
                        <button
                            onClick={handlePurge}
                            className="w-full text-left p-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex justify-between items-center group text-rose-700"
                        >
                            <div>
                                <div className="font-bold">Purge System Cache</div>
                                <div className="text-sm text-rose-500">Reset all real-time analytics calculations</div>
                            </div>
                            <Lock size={20} className="opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Ranking Config Panel ────────────────────────────────────────────────────

interface RankingConfigPanelProps {
    config: RankingConfig;
    totalWeight: number;
    isValid: boolean;
    saving: boolean;
    saveStatus: 'idle' | 'success' | 'error';
    error: string;
    onToggle: (key: string) => void;
    onWeightChange: (key: string, val: number) => void;
    onReset: () => void;
    onSave: () => void;
}

function RankingConfigPanel({
    config, totalWeight, isValid, saving, saveStatus, error,
    onToggle, onWeightChange, onReset, onSave
}: RankingConfigPanelProps) {

    const remaining = 100 - totalWeight;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Student Ranking Configuration</h2>
                            <p className="text-indigo-200 text-sm">Set which parameters determine student PRS score &amp; rank</p>
                        </div>
                    </div>
                    {/* Total badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm backdrop-blur-sm transition-all ${
                        isValid ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                                : 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
                    }`}>
                        {isValid
                            ? <CheckCircle size={16} />
                            : <AlertTriangle size={16} />
                        }
                        Total: {totalWeight.toFixed(1)}% / 100%
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Info banner */}
                <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                    <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-700">
                        <strong>How it works:</strong> Each enabled parameter's weight determines its contribution to a student's PRS (Placement Readiness Score). 
                        Weights of all <strong>enabled</strong> parameters must sum to exactly <strong>100%</strong>. Disabled parameters are excluded from ranking entirely.
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Weight Distribution</span>
                        <span className={remaining < 0 ? 'text-rose-500 font-bold' : remaining === 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                            {remaining > 0 ? `${remaining.toFixed(1)}% remaining` : remaining < 0 ? `${Math.abs(remaining).toFixed(1)}% over limit!` : '✓ Perfect balance'}
                        </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min(totalWeight, 100)}%`,
                                background: isValid
                                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6, #10b981)'
                                    : totalWeight > 100
                                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            }}
                        />
                    </div>
                    {/* Mini colour legend */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(config).map(([key, param]) => {
                            if (!param.enabled) return null;
                            const meta = PARAM_META[key];
                            return (
                                <span
                                    key={key}
                                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
                                    style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                                >
                                    <span>{meta.icon}</span>
                                    {param.label}: {param.weight}%
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Parameter sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(config).map(([key, param]) => {
                        const meta = PARAM_META[key] ?? { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', icon: '📊' };
                        return (
                            <ParameterSlider
                                key={key}
                                paramKey={key}
                                param={param}
                                meta={meta}
                                onToggle={() => onToggle(key)}
                                onWeightChange={(val) => onWeightChange(key, val)}
                            />
                        );
                    })}
                </div>

                {/* Error message */}
                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {/* Success message */}
                {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
                        <CheckCircle size={16} />
                        Ranking configuration saved! Student rankings will reflect these weights.
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm font-semibold"
                    >
                        <RotateCcw size={15} />
                        Reset to Default
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving || !isValid}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                            isValid && !saving
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={15} />
                                Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Individual Parameter Slider ─────────────────────────────────────────────

interface ParameterSliderProps {
    paramKey: string;
    param: RankingParam;
    meta: { color: string; bg: string; border: string; icon: string };
    onToggle: () => void;
    onWeightChange: (val: number) => void;
}

function ParameterSlider({ paramKey, param, meta, onToggle, onWeightChange }: ParameterSliderProps) {
    return (
        <div
            className="rounded-xl border p-4 transition-all duration-200"
            style={{
                background: param.enabled ? meta.bg : '#f8fafc',
                borderColor: param.enabled ? meta.border : '#e2e8f0',
                opacity: param.enabled ? 1 : 0.6,
            }}
        >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <div>
                        <div className="font-bold text-slate-800 text-sm">{param.label}</div>
                        <div className="text-xs text-slate-500">{paramKey.toUpperCase()}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className="text-sm font-bold px-2 py-0.5 rounded-lg"
                        style={{ color: param.enabled ? meta.color : '#94a3b8', background: param.enabled ? 'white' : '#f1f5f9' }}
                    >
                        {param.weight}%
                    </span>
                    {/* Toggle */}
                    <button
                        onClick={onToggle}
                        id={`toggle-param-${paramKey}`}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${param.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${param.enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={param.weight}
                    disabled={!param.enabled}
                    onChange={e => onWeightChange(Number(e.target.value))}
                    id={`slider-${paramKey}`}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-not-allowed"
                    style={{
                        background: param.enabled
                            ? `linear-gradient(to right, ${meta.color} 0%, ${meta.color} ${param.weight}%, #e2e8f0 ${param.weight}%, #e2e8f0 100%)`
                            : '#e2e8f0',
                        accentColor: meta.color,
                    }}
                />
            </div>

            {/* Min/Max labels */}
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                <span>1%</span>
                <span>100%</span>
            </div>
        </div>
    );
}

// ─── Simple Setting Toggle ────────────────────────────────────────────────────

function SettingItem({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0">
            <div>
                <div className="font-bold text-slate-900">{label}</div>
                <div className="text-sm text-slate-500 font-medium mt-0.5">{description}</div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ml-8 flex-shrink-0 ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}
