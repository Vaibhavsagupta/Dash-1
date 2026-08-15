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

    // AI Risk Engine Weights config
    const [riskWeights, setRiskWeights] = useState<any>({
        academic: { label: "Academic Marks", weight: 25.0, icon: "🎓" },
        attendance: { label: "Attendance Score", weight: 20.0, icon: "📅" },
        engagement: { label: "Platform Engagement", weight: 15.0, icon: "💻" },
        assessment_trend: { label: "30-Day Assessment Trend", weight: 15.0, icon: "📈" },
        assignment: { label: "Assignment & Test Submission", weight: 20.0, icon: "📝" },
        backlog: { label: "Active Backlogs", weight: 5.0, icon: "⚠️" }
    });
    const [riskSaving, setRiskSaving] = useState(false);
    const [riskSaveStatus, setRiskSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [riskError, setRiskError] = useState('');

    useEffect(() => {
        fetchSettings();
        fetchRankingConfig();
        fetchRiskWeights();
    }, []);

    const fetchRiskWeights = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/risk-weights`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRiskWeights(data);
            }
        } catch (err) { console.error(err); }
    };

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

    const totalRiskWeight = Object.values(riskWeights).reduce(
        (sum: number, p: any) => sum + (p.weight || 0), 0
    );
    const isRiskValid = Math.abs(totalRiskWeight - 100) <= 0.5;

    const handleRiskWeightChange = (key: string, val: number) => {
        setRiskWeights((prev: any) => ({
            ...prev,
            [key]: { ...prev[key], weight: val }
        }));
        setRiskSaveStatus('idle');
        setRiskError('');
    };

    const handleSaveRiskWeights = async () => {
        if (!isRiskValid) {
            setRiskError(`Total weight of AI risk parameters must equal 100%. Currently: ${totalRiskWeight.toFixed(1)}%`);
            return;
        }
        setRiskSaving(true);
        setRiskError('');
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/settings/risk-weights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ config: riskWeights })
            });
            if (res.ok) {
                setRiskSaveStatus('success');
                setTimeout(() => setRiskSaveStatus('idle'), 3000);
            } else {
                const err = await res.json();
                setRiskError(err.detail || 'Save failed');
                setRiskSaveStatus('error');
            }
        } catch {
            setRiskError('Network error. Please try again.');
            setRiskSaveStatus('error');
        } finally {
            setRiskSaving(false);
        }
    };

    const handleAddCustomFactor = (key: string, label: string, weight: number, icon: string) => {
        setRiskWeights((prev: any) => ({
            ...prev,
            [key]: { label, weight, icon }
        }));
        setRiskSaveStatus('idle');
        setRiskError('');
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Platform Settings</h1>
                <p className="text-slate-500 font-medium font-sans">Configure AI Risk Engine weights, ranking parameters &amp; administrative controls.</p>
            </header>

            {/* ── AI Risk Engine Ratio Weights Panel ── */}
            <div className="mb-8">
                <AIRiskWeightsPanel
                    riskWeights={riskWeights}
                    totalRiskWeight={totalRiskWeight}
                    isRiskValid={isRiskValid}
                    saving={riskSaving}
                    saveStatus={riskSaveStatus}
                    error={riskError}
                    onWeightChange={handleRiskWeightChange}
                    onSave={handleSaveRiskWeights}
                    onAddCustomFactor={handleAddCustomFactor}
                />
            </div>

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

// ─── AI Risk Engine Ratio Weights Panel ──────────────────────────────────────

interface AIRiskWeightsPanelProps {
    riskWeights: any;
    totalRiskWeight: number;
    isRiskValid: boolean;
    saving: boolean;
    saveStatus: 'idle' | 'success' | 'error';
    error: string;
    onWeightChange: (key: string, val: number) => void;
    onSave: () => void;
    onAddCustomFactor?: (key: string, label: string, weight: number, icon: string) => void;
}

function AIRiskWeightsPanel({
    riskWeights, totalRiskWeight, isRiskValid, saving, saveStatus, error,
    onWeightChange, onSave, onAddCustomFactor
}: AIRiskWeightsPanelProps) {
    const remaining = 100 - totalRiskWeight;
    const [showAddForm, setShowAddForm] = useState(false);
    const [customLabel, setCustomLabel] = useState('');
    const [customWeight, setCustomWeight] = useState(10);
    const [customIcon, setCustomIcon] = useState('⭐');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customLabel.trim()) return;
        const key = customLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (onAddCustomFactor) {
            onAddCustomFactor(key, customLabel.trim(), customWeight, customIcon);
        }
        setCustomLabel('');
        setShowAddForm(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                            🤖
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Risk Engine Weight Ratios</h2>
                            <p className="text-emerald-100 text-sm">Configure how much each factor impacts student RAG risk classification</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30 flex items-center gap-1"
                        >
                            + Add Custom AI Factor
                        </button>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm backdrop-blur-sm transition-all ${
                            isRiskValid ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                                        : 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
                        }`}>
                            {isRiskValid ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            Total Ratio: {totalRiskWeight.toFixed(1)}% / 100%
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                    <Info size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-emerald-800">
                        <strong>AI Engine Ratio Customization:</strong> Adjust weight ratios or add custom factors below. The AI Engine automatically processes and factors all dynamic parameters into student Risk Analysis. Total sum must equal 100%.
                    </p>
                </div>

                {/* Add Custom Factor Form */}
                {showAddForm && (
                    <form onSubmit={handleAdd} className="mb-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap gap-4 items-end animate-fade-in">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Factor Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Mid Sem Marks, Soft Skills"
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none text-slate-900 focus:border-emerald-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Weight %</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={customWeight}
                                onChange={(e) => setCustomWeight(parseFloat(e.target.value) || 0)}
                                className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none text-slate-900 focus:border-emerald-600"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Icon</label>
                            <select
                                value={customIcon}
                                onChange={(e) => setCustomIcon(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold outline-none text-slate-900 focus:border-emerald-600 cursor-pointer"
                            >
                                <option value="⭐">⭐ Star</option>
                                <option value="🎯">🎯 Target</option>
                                <option value="📊">📊 Chart</option>
                                <option value="💡">💡 Idea</option>
                                <option value="🏆">🏆 Trophy</option>
                                <option value="🧠">🧠 Brain</option>
                            </select>
                        </div>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition">
                            Add Factor
                        </button>
                    </form>
                )}

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                        <span>Risk Weights Allocation</span>
                        <span className={remaining < 0 ? 'text-rose-500 font-bold' : remaining === 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                            {remaining > 0 ? `${remaining.toFixed(1)}% remaining` : remaining < 0 ? `${Math.abs(remaining).toFixed(1)}% over limit!` : '✓ Balanced (100%)'}
                        </span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min(totalRiskWeight, 100)}%`,
                                background: isRiskValid
                                    ? 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1)'
                                    : 'linear-gradient(90deg, #ef4444, #f97316)',
                            }}
                        />
                    </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Object.entries(riskWeights).map(([key, item]: [string, any]) => (
                        <div key={key} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                    <span>{item.icon || '⭐'}</span> {item.label}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {item.weight}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={item.weight}
                                onChange={(e) => onWeightChange(key, parseFloat(e.target.value) || 0)}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-slate-200"
                            />
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-4 text-sm font-medium">
                        <CheckCircle size={16} />
                        AI Risk Engine weight ratios saved successfully! AI risk scores will immediately reflect these custom ratios.
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                        onClick={onSave}
                        disabled={saving || !isRiskValid}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                            isRiskValid && !saving
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {saving ? 'Saving AI Ratios...' : 'Save AI Risk Ratios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
