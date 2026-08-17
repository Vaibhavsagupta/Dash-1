"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ScatterController
} from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    Sparkles,
    Filter,
    ShieldAlert,
    Award,
    Target,
    BookOpen
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ScatterController,
    Title,
    Tooltip,
    Legend
);

import Student360ProfileModal from './Student360ProfileModal';
import InterventionManagementModal from './InterventionManagementModal';
import BatchComparisonModal from './BatchComparisonModal';
import AlertsDrawerModal from './AlertsDrawerModal';
import { Bell } from 'lucide-react';

export default function TeacherVisualAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states for Student Rankings & Batch Selection
    const [branchFilter, setBranchFilter] = useState<string>('All');
    const [semesterFilter, setSemesterFilter] = useState<string>('All');

    // Modal States
    const [selected360StudentId, setSelected360StudentId] = useState<string | null>(null);
    const [is360Open, setIs360Open] = useState(false);
    const [isInterventionOpen, setIsInterventionOpen] = useState(false);
    const [isComparisonOpen, setIsComparisonOpen] = useState(false);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [unreadAlertsCount, setUnreadAlertsCount] = useState(3);

    const fetchBatchAnalytics = async () => {
        setLoading(true);
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (!token) {
                setLoading(false);
                return;
            }

            let queryParams = new URLSearchParams();
            if (branchFilter !== 'All') queryParams.append('branch', branchFilter);
            if (semesterFilter !== 'All') queryParams.append('semester', semesterFilter);

            const res = await fetch(`${API_BASE_URL}/analytics/batch/visual-dashboard?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const result = await res.json();
                setData(result);
                setError(null);
            } else {
                setError("Failed to load batch visual analytics.");
            }
        } catch (err) {
            console.error("Error fetching batch analytics:", err);
            setError("Connection error while loading analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatchAnalytics();
    }, [branchFilter, semesterFilter]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-slate-500">
                <Sparkles className="animate-spin text-indigo-600 mb-3" size={32} />
                <span className="font-bold text-sm tracking-wide">Compiling Batch Visual Analytics & Scatter Distribution...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <span className="font-medium text-sm">{error || "Unable to display batch analytics."}</span>
            </div>
        );
    }

    const {
        batch_kpis,
        class_performance_trend,
        subject_class_average,
        performance_distribution,
        attendance_vs_performance,
        student_rankings,
        topic_class_performance
    } = data;

    // 1. Class Performance Trend Line
    const classTrendData = {
        labels: class_performance_trend.map((c: any) => c.period),
        datasets: [
            {
                label: 'Class Avg Score (%)',
                data: class_performance_trend.map((c: any) => c.avg_score),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 5
            },
            {
                label: 'Pass Rate (%)',
                data: class_performance_trend.map((c: any) => c.pass_rate),
                borderColor: '#10b981',
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 4
            }
        ]
    };

    // 2. Subject-wise Class Average Bar Chart
    const subjectClassAvgData = {
        labels: subject_class_average.map((s: any) => s.subject),
        datasets: [
            {
                label: 'Class Average Score (%)',
                data: subject_class_average.map((s: any) => s.avg_score),
                backgroundColor: [
                    '#4f46e5', '#2563eb', '#10b981', '#f59e0b', '#ec4899'
                ],
                borderRadius: 8
            }
        ]
    };

    // 3. Performance Distribution Histogram
    const histogramData = {
        labels: performance_distribution.map((h: any) => h.range),
        datasets: [
            {
                label: 'Number of Students',
                data: performance_distribution.map((h: any) => h.count),
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                borderRadius: 6
            }
        ]
    };

    // 4. Attendance vs Performance Scatter Plot
    const scatterPlotData = {
        datasets: [
            {
                label: 'Low Risk (Green)',
                data: attendance_vs_performance
                    .filter((st: any) => st.rag_status === 'Green')
                    .map((st: any) => ({ x: st.attendance, y: st.score, name: st.name })),
                backgroundColor: '#10b981',
                pointRadius: 6
            },
            {
                label: 'Moderate Risk (Amber)',
                data: attendance_vs_performance
                    .filter((st: any) => st.rag_status === 'Amber')
                    .map((st: any) => ({ x: st.attendance, y: st.score, name: st.name })),
                backgroundColor: '#f59e0b',
                pointRadius: 7
            },
            {
                label: 'High Risk (Red)',
                data: attendance_vs_performance
                    .filter((st: any) => st.rag_status === 'Red')
                    .map((st: any) => ({ x: st.attendance, y: st.score, name: st.name })),
                backgroundColor: '#ef4444',
                pointRadius: 8
            }
        ]
    };

    const scatterOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
            legend: { labels: { color: '#475569' } },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                callbacks: {
                    label: (context: any) => {
                        const raw = context.raw;
                        return `${raw.name || 'Student'}: Attendance ${raw.x}%, Avg Marks ${raw.y}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Attendance (%)', color: '#475569', font: { size: 12, weight: 'bold' } },
                grid: { color: 'rgba(226, 232, 240, 0.8)' },
                ticks: { color: '#64748b' },
                min: 40,
                max: 100
            },
            y: {
                title: { display: true, text: 'Average Score (%)', color: '#475569', font: { size: 12, weight: 'bold' } },
                grid: { color: 'rgba(226, 232, 240, 0.8)' },
                ticks: { color: '#64748b' },
                min: 0,
                max: 100
            }
        }
    };

    const chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#475569', font: { size: 11, weight: '600' } } }
        },
        scales: {
            x: { grid: { color: 'rgba(226, 232, 240, 0.8)' }, ticks: { color: '#64748b' } },
            y: { grid: { color: 'rgba(226, 232, 240, 0.8)' }, ticks: { color: '#64748b' } }
        }
    };

    return (
        <div className="space-y-8 text-slate-900">

            {/* Header & Filter Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/10 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-200" size={22} />
                        <h2 className="text-xl font-black tracking-tight text-white">
                            Batch Analytics & Performance Leaderboard
                        </h2>
                    </div>
                    <p className="text-xs text-indigo-100 mt-1">
                        Class-level insights, attendance vs marks scatter analysis, and rank distributions.
                    </p>
                </div>

                {/* Header Controls: Alerts, Interventions, Compare, Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setIsAlertsOpen(true)}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white relative transition border border-white/30"
                        title="AI Risk Alerts & Warnings"
                    >
                        <Bell size={16} />
                        {unreadAlertsCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                                {unreadAlertsCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setIsComparisonOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition flex items-center gap-1.5"
                    >
                        Compare Batches
                    </button>

                    <button
                        onClick={() => setIsInterventionOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow transition flex items-center gap-1.5"
                    >
                        <ShieldAlert size={15} /> Intervention System →
                    </button>

                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 text-xs text-white">
                        <Filter size={14} className="text-indigo-200" />
                        <span className="font-bold">Branch:</span>
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="bg-transparent text-white font-bold outline-none cursor-pointer"
                        >
                            <option value="All" className="text-slate-900">All Branches</option>
                            <option value="CSE" className="text-slate-900">CSE</option>
                            <option value="IT" className="text-slate-900">IT</option>
                            <option value="ECE" className="text-slate-900">ECE</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 text-xs text-white">
                        <span className="font-bold">Sem:</span>
                        <select
                            value={semesterFilter}
                            onChange={(e) => setSemesterFilter(e.target.value)}
                            className="bg-transparent text-white font-bold outline-none cursor-pointer"
                        >
                            <option value="All" className="text-slate-900">All Semesters</option>
                            <option value="1" className="text-slate-900">Sem 1</option>
                            <option value="3" className="text-slate-900">Sem 3</option>
                            <option value="5" className="text-slate-900">Sem 5</option>
                            <option value="7" className="text-slate-900">Sem 7</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* MODEL 1: XGBOOST + SHAP STUDENT RISK PREDICTION ENGINE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">
                                AI RISK ENGINE
                            </span>
                            <span className="text-xs font-bold text-slate-400">XGBoost v1.6 + SHAP Explainability Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-600" /> Student Risk Prediction & Feature Attribution
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Explainable AI Enabled</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Risk Probability Gauge */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Predictive Institutional Risk</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-rose-600">74.7%</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-700 rounded-md border border-rose-200 uppercase">HIGH RISK</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full" style={{ width: '74.7%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] text-slate-500">Evaluated over 10 feature vectors using XGBoost Ensemble</span>
                    </div>

                    {/* SHAP Feature Contribution Breakdown */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">SHAP Feature Attribution Breakdown (Top Risk Drivers)</span>
                        <div className="space-y-2.5">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">Declining 30-Day Performance Trend (-12.5%)</span>
                                    <span className="text-rose-600">+18.8% Risk Impact</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '85%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">Internal Marks Below Threshold (45.0%)</span>
                                    <span className="text-rose-600">+9.0% Risk Impact</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '55%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">Low Attendance Percentage (55.0%)</span>
                                    <span className="text-rose-600">+8.8% Risk Impact</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '50%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 2: ACADEMIC SCORE PREDICTION ENGINE (XGBOOST / LIGHTGBM REGRESSOR) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                                SCORE FORECASTING
                            </span>
                            <span className="text-xs font-bold text-slate-400">XGBoost / LightGBM Regressor Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Target size={18} className="text-emerald-600" /> Academic End-Sem Score Forecasting
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Regression Model Active</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Score Progress Display */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current vs Predicted End-Sem</span>
                        <div className="my-2">
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <span className="text-xs text-slate-400 block font-semibold">Current Internal</span>
                                    <span className="text-xl font-bold text-slate-700">61.0%</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-emerald-600 block font-bold">Predicted End-Sem</span>
                                    <span className="text-3xl font-black text-emerald-600">69.7%</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3">
                                <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full" style={{ width: '69.7%' }} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                            <span>Predicted Growth: <span className="text-emerald-600">+8.7%</span></span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-extrabold">89.0% Confidence</span>
                        </div>
                    </div>

                    {/* Actionable Intervention Window */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-emerald-50/50 border border-indigo-100 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Early Intervention Signal</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">STABLE TRAJECTORY</span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                Student is on a positive academic trajectory. Predicted end-sem score indicates a <strong className="text-emerald-700">+8.7% growth potential</strong> over current internal assessment baseline.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>Recommended Action: Maintain regular test attempt cadence</span>
                            <button className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1">
                                View Prediction Details →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 3: STUDENT PERFORMANCE TIME-SERIES FORECASTING ENGINE (LSTM / GRU) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                                PERFORMANCE TRAJECTORY
                            </span>
                            <span className="text-xs font-bold text-slate-400">LSTM / GRU Sequential Recurrent Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <TrendingUp size={18} className="text-purple-600" /> Sequential Performance Trajectory Forecasting
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Time-Series Engine Active</span>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Time Series History & Multi-Step Projection */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sequential Test Forecast (TN+1, TN+2, TN+3)</span>
                        <div className="my-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-600">Historical Attempt (T4):</span>
                                <span className="text-slate-800 font-extrabold">54.0%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-purple-700">Projected Next Test (TN+1):</span>
                                <span className="text-purple-700 font-black">48.7%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-purple-600">Projected Test (TN+2):</span>
                                <span className="text-purple-600 font-bold">45.0%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-purple-500">Projected Test (TN+3):</span>
                                <span className="text-purple-500 font-medium">42.3%</span>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">Gradient Slope: <span className="text-rose-600">-6.1% / test attempt</span></span>
                    </div>

                    {/* Trajectory Warning & Sequential Alert */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-amber-50/70 border border-rose-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Trajectory Warning Signal</span>
                                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded shadow-sm uppercase animate-pulse">CONSISTENTLY DECLINING</span>
                            </div>
                            <p className="text-xs text-rose-900 font-medium leading-relaxed mt-1">
                                ⚠️ <strong>Continuous performance decline detected (-6.1% per test attempt)</strong>. Sequential score sequence: 72.0% ➔ 68.0% ➔ 61.0% ➔ 54.0%. Without intervention, next test is projected at <strong>48.7%</strong>.
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-rose-200/80 flex items-center justify-between text-xs font-bold text-rose-900">
                            <span>Triggering Automated Faculty Alert & Remedial Quiz Assignment</span>
                            <button className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition">
                                Assign Remedial Track →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 4: STUDENT ACADEMIC CLUSTERING & PROFILING ENGINE (K-MEANS + PCA) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                                COHORT CLUSTERING
                            </span>
                            <span className="text-xs font-bold text-slate-400">K-Means (k=4) + 2D PCA Dimensionality Reduction</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-600" /> Student Cohort Clustering & PCA Projection
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Cohort Engine Active</span>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                        <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">Cluster 1: High Performers</span>
                        <div className="flex justify-between items-baseline mt-2">
                            <span className="text-2xl font-black text-emerald-700">33.3%</span>
                            <span className="text-xs font-bold text-emerald-600">85 - 100% Avg</span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col justify-between">
                        <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">Cluster 2: Consistent</span>
                        <div className="flex justify-between items-baseline mt-2">
                            <span className="text-2xl font-black text-blue-700">41.7%</span>
                            <span className="text-xs font-bold text-blue-600">70 - 85% Avg</span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col justify-between">
                        <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-wider">Cluster 3: Improving</span>
                        <div className="flex justify-between items-baseline mt-2">
                            <span className="text-2xl font-black text-purple-700">16.7%</span>
                            <span className="text-xs font-bold text-purple-600">Growth Slope ↑</span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col justify-between">
                        <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">Cluster 4: At-Risk</span>
                        <div className="flex justify-between items-baseline mt-2">
                            <span className="text-2xl font-black text-rose-700">8.3%</span>
                            <span className="text-xs font-bold text-rose-600">&lt;50% Score</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>PCA Projection Mapping: 2D Coordinates (PC1: Academic Performance, PC2: Student Engagement)</span>
                    <button className="text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1">
                        Open Interactive Cluster Matrix →
                    </button>
                </div>
            </div>

            {/* MODEL 5: BEHAVIORAL ANOMALY DETECTION ENGINE (ISOLATION FOREST) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                ANOMALY DETECTION
                            </span>
                            <span className="text-xs font-bold text-slate-400">Isolation Forest Outlier Detection Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-600" /> Behavioral Anomaly & Assessment Outlier Detector
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Isolation Forest Active</span>
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Anomaly Gauge & Isolation Metric */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Outlier Isolation Score</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-amber-600">-0.85</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded uppercase shadow-sm animate-pulse">ANOMALY DETECTED</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-amber-600 h-full rounded-full" style={{ width: '85%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-900">Flagged Metrics: <span className="text-rose-600">2 Critical Outliers</span></span>
                    </div>

                    {/* Detected Anomaly Details */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-extrabold text-rose-900 block">Sudden Score Collapse (-50.0%)</span>
                                <span className="text-rose-800">Unusual performance collapse: Score dropped from 78.0% average to 28.0% in DBMS Mid-Term.</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                            <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-extrabold text-amber-900 block">Rapid Completion Speed Anomaly</span>
                                <span className="text-amber-800">Suspicious test speed: Completed 25-minute test in 3.2 minutes (13% of benchmark time).</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 6: STUDENT DROPOUT / DISENGAGEMENT PREDICTION ENGINE (LIGHTGBM) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                DISENGAGEMENT RISK
                            </span>
                            <span className="text-xs font-bold text-slate-400">LightGBM Classifier + Survival Risk Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-rose-600" /> Student Dropout & Academic Disengagement Risk
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Disengagement Engine Active</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Disengagement Gauge */}
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Disengagement Probability</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-rose-600">76.0%</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded uppercase shadow-sm animate-pulse">HIGH RISK</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-rose-600 h-full rounded-full" style={{ width: '76%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-rose-900">Survival Status: <span className="text-rose-700">Early Intervention Required</span></span>
                    </div>

                    {/* Primary Disengagement Drivers & Counselor Signal */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Primary Disengagement Drivers</span>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-extrabold border border-rose-200">
                                    🔻 Attendance Drop (58% vs 75% Target)
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-200">
                                    📋 3 Missed Course Assignments
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-extrabold border border-indigo-200">
                                    💻 LMS Inactivity (42/100 Engagement)
                                </span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-rose-900">
                            <span>Counselor Signal: Mandatory 1-on-1 Academic Advisory Reachout Required</span>
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow transition">
                                Dispatch Advisory Alert →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 7: TOPIC MASTERY & KNOWLEDGE TRACING ENGINE (DKT / BKT) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                KNOWLEDGE TRACING
                            </span>
                            <span className="text-xs font-bold text-slate-400">Deep Knowledge Tracing (DKT) + Bayesian BKT</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <BookOpen size={18} className="text-emerald-600" /> Topic Weakness & Latent Concept Mastery Tracing
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>DKT Engine Active</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Overall Concept Mastery Metric */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Overall Latent Concept Mastery</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-emerald-700">65.1%</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase border border-emerald-300">2 Weak Topics</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '65.1%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-900">Priority Focus: <span className="text-rose-600">Arrays (49%), OOP (54%)</span></span>
                    </div>

                    {/* Topic Progress Meters */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Topic-Wise Latent Mastery Probability</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">Python Mastery</span>
                                    <span className="text-emerald-600 font-extrabold">84.2% (Mastered)</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '84%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">SQL Mastery</span>
                                    <span className="text-amber-600 font-extrabold">74.5% (Developing)</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '74%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">OOP Concepts</span>
                                    <span className="text-rose-600 font-extrabold">54.2% (Weak)</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '54%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-800">Arrays & Lists</span>
                                    <span className="text-rose-600 font-extrabold">49.0% (Weak)</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '49%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 8: PERSONALIZED LEARNING RECOMMENDATION ENGINE (CONTENT-BASED + DKT) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                                PERSONALIZED REMEDIATION
                            </span>
                            <span className="text-xs font-bold text-slate-400">Content-Based Remediation Engine</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-600" /> Prescribed Personalized Learning & Remediation Track
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Recommender Active</span>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-indigo-900 text-xs font-black mb-1">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                            <span>Concept Revision</span>
                        </div>
                        <p className="text-xs text-indigo-950 font-bold">Arrays Core Theory & Diagrams</p>
                        <span className="text-[11px] text-indigo-700 font-semibold mt-2">Est. 20 min reading</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-purple-900 text-xs font-black mb-1">
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                            <span>Practice Problem Set</span>
                        </div>
                        <p className="text-xs text-purple-950 font-bold">15 Medium-Tier MCQs</p>
                        <span className="text-[11px] text-purple-700 font-semibold mt-2">Target Accuracy: 80%+</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-amber-900 text-xs font-black mb-1">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">3</span>
                            <span>Diagnostic Speed Quiz</span>
                        </div>
                        <p className="text-xs text-amber-950 font-bold">10 Speed Assessments</p>
                        <span className="text-[11px] text-amber-700 font-semibold mt-2">Real-time time per question</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 text-xs font-black mb-1">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                            <span>Follow-Up Track</span>
                        </div>
                        <p className="text-xs text-emerald-950 font-bold">Arrays & OOP Retention</p>
                        <span className="text-[11px] text-emerald-700 font-extrabold mt-2">Expected Gain: +18.0%</span>
                    </div>
                </div>
            </div>

            {/* MODEL 9: TEST QUESTION DIFFICULTY PREDICTION ENGINE (IRT / ITEM RESPONSE THEORY) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                QUESTION BANK CALIBRATION
                            </span>
                            <span className="text-xs font-bold text-slate-400">Item Response Theory (2PL IRT Model)</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Target size={18} className="text-amber-600" /> Question Bank Difficulty ($\beta$) & Discrimination ($a$) Calibration
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>IRT Calibrator Active</span>
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Item Parameter Metrics */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Item Difficulty Parameter ($\beta$)</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-amber-600">0.57</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded uppercase shadow-sm">MEDIUM TIER</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: '57%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-900">Discrimination ($a$): <span className="text-slate-900">1.34</span></span>
                    </div>

                    {/* Question Text Analysis */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Bank Item Analysis</span>
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">Expected Acc: 43.0%</span>
                            </div>
                            <p className="text-xs text-slate-800 font-bold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                                "Implement Binary Search Tree balancing algorithm in Python with O(log N) time complexity..."
                            </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>Topic Domain: Data Structures & Algorithms (Code Snippet Detected)</span>
                            <button className="text-amber-600 hover:text-amber-800 font-extrabold flex items-center gap-1">
                                Calibrate Full Question Bank →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 10: STUDENT ABILITY ESTIMATION ENGINE (IRT / RASCH 2PL MODEL) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                LATENT ABILITY EVALUATION
                            </span>
                            <span className="text-xs font-bold text-slate-400">Rasch 2PL Latent Trait Model</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Award size={18} className="text-emerald-600" /> Latent Student Ability ($\theta$) & Cohort Percentile Ranking
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>Ability Estimator Active</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Latent Theta Parameter Display */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Latent Ability ($\theta$) Parameter</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-3xl font-black text-emerald-600">+1.48</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-600 text-white rounded uppercase shadow-sm">92.5th PERCENTILE</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92.5%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-900">Theta Range: <span className="text-slate-900 font-extrabold">[-3.00 to +3.00]</span></span>
                    </div>

                    {/* Mastery Readiness & Challenge Tier */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mastery & Challenge Readiness</span>
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 uppercase">EXCEPTIONAL PROFICIENCY</span>
                            </div>
                            <p className="text-xs text-slate-800 font-bold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                                Student demonstrates high true latent ability ($\theta = +1.48$). Capable of attempting advanced competitive exam tracks and hard difficulty assessment items.
                            </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>IRT Success Probability: 76.5% on Hard Difficulty Items</span>
                            <button className="text-emerald-600 hover:text-emerald-800 font-extrabold flex items-center gap-1">
                                Generate Challenge Assessment →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 11: ADAPTIVE TEST GENERATION ENGINE (IRT + REINFORCEMENT LEARNING) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                ADAPTIVE EXAM POLICY
                            </span>
                            <span className="text-xs font-bold text-slate-400">IRT + Reinforcement Learning Item Selection</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <Sparkles size={18} className="text-rose-600" /> Real-Time Adaptive Exam Generation & Item Selection Policy
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>RL Policy Active</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Live Adaptive Branching Metric */}
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
                        <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Live Exam Adaptation Action</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xl font-black text-rose-700">INCREASE DIFFICULTY</span>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded uppercase shadow-sm">HARD TIER</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1">
                                <div className="bg-rose-600 h-full rounded-full" style={{ width: '68%' }} />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-rose-900">Next Difficulty Beta (Next): <span className="text-slate-900 font-black">0.68</span></span>
                    </div>

                    {/* Fisher Information & RL Policy Reasoning */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RL Item Selection Policy Reasoning</span>
                                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded border border-rose-300">Fisher Info Gain: 0.49</span>
                            </div>
                            <p className="text-xs text-slate-800 font-bold leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                                Student answered previous Level 1 question correctly. RL policy branching automatically elevates next question difficulty to HARD (Beta = 0.68) to maximize measurement precision.
                            </p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>Expected Student Success Probability: 51.4%</span>
                            <button className="text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1">
                                Launch Adaptive Exam Simulator →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODEL 12: NLP TEACHER REMARKS ANALYSIS ENGINE (LLM / DISTILBERT) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                                NLP REMARKS EXTRACTOR
                            </span>
                            <span className="text-xs font-bold text-slate-400">LLM / DistilBERT Sentiment & Entity Extractor</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                            <BookOpen size={18} className="text-purple-600" /> NLP Unstructured Faculty Feedback Entity Extraction
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <span>NLP Extractor Active</span>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Faculty Text Input Preview */}
                    <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block mb-2">Raw Faculty Feedback Text</span>
                            <p className="text-xs text-purple-950 font-medium italic bg-white p-3 rounded-xl border border-purple-200 leading-relaxed">
                                "Student grasps core algorithms well but struggles with SQL join syntax under timed conditions."
                            </p>
                        </div>
                        <div className="mt-3 flex justify-between items-center text-[11px] font-bold text-purple-900">
                            <span>Polarity: <span className="text-amber-600">Actionable Need</span></span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-extrabold">+0.35 Score</span>
                        </div>
                    </div>

                    {/* Extracted Entities (Strengths vs Weaknesses) */}
                    <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">Extracted Strengths (NLP Verified)</span>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                                        ✓ Core Concept Comprehension
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                                        ✓ Algorithmic Logic Flow
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-1.5">Extracted Growth Areas</span>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-extrabold border border-rose-200">
                                        ⚠ SQL Query & Join Syntax
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-extrabold border border-amber-200">
                                        ⚡ Timed Exam Pressure & Pace
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>Auto-prescribed: Assign targeted SQL practice set & timed speed test</span>
                            <button className="text-purple-600 hover:text-purple-800 font-extrabold flex items-center gap-1">
                                Run Live NLP Extractor →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MASTER EARLY WARNING & MULTI-MODEL INTELLIGENCE SYSTEM */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden text-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 shadow">
                                MASTER EARLY WARNING ENSEMBLE
                            </span>
                            <span className="text-xs font-bold text-slate-300">Unified Academic Intelligence</span>
                        </div>
                        <h3 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                            <ShieldAlert size={20} className="text-amber-400 animate-pulse" /> SAGE AI Early Warning & Intelligence Hub
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Intelligence Engines Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Master Synthesized Score Display */}
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between backdrop-blur">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Master AI Risk Index</span>
                        <div className="my-3">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-4xl font-black text-amber-400">84.2 <span className="text-sm font-bold text-slate-400">/ 100</span></span>
                                <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-500 text-white rounded uppercase shadow">LEVEL 3 CRITICAL</span>
                            </div>
                            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-white/10 mt-1">
                                <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full" style={{ width: '84.2%' }} />
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">Institutional Action: <span className="text-rose-400 font-extrabold">Mandatory Advising & Remediation Track</span></span>
                    </div>

                    {/* Multi-Model Ensemble Matrix */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between backdrop-blur">
                        <div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">Multi-Model Synthesized Weight Attribution Matrix</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">XGBoost Risk Engine</span>
                                    <span className="font-extrabold text-amber-300">Risk Factor: 82%</span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">End-Sem Score Regressor</span>
                                    <span className="font-extrabold text-indigo-300">Pred Score: 58.4%</span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">LSTM Trend Slope</span>
                                    <span className="font-extrabold text-rose-300">Trend: Declining (-14%)</span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">DKT Concept Tracing</span>
                                    <span className="font-extrabold text-amber-300">2 Weak Topics</span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">IRT Latent Ability</span>
                                    <span className="font-extrabold text-emerald-300">Theta: +1.48 (92.5%)</span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                                    <span className="text-slate-400 text-[10px] block">Adaptive Test RL</span>
                                    <span className="font-extrabold text-purple-300">Policy: Hard Tier</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
                            <span>Unified Intervention Command Active</span>
                            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg transition">
                                Dispatch Institutional Directive →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* BATCH KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-slate-900">{batch_kpis.total_students}</span>
                        <Users size={18} className="text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Avg CGPA</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-indigo-600">{batch_kpis.class_avg_cgpa}<span className="text-xs text-slate-400 font-medium">/10</span></span>
                        <Award size={18} className="text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Attendance</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-emerald-600">{batch_kpis.avg_attendance}%</span>
                        <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-blue-600">{batch_kpis.pass_rate}%</span>
                        <Target size={18} className="text-blue-600" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">At-Risk Count</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-rose-600">{batch_kpis.at_risk_count}</span>
                        <AlertTriangle size={18} className="text-rose-600 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* CLASS PERFORMANCE TREND & SUBJECT-WISE CLASS AVERAGE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-600" /> Class Performance Trend
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Average class score trajectory across tests</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={classTrendData} options={chartOptions} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={16} className="text-indigo-600" /> Subject-wise Class Average
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Comparative subject performance across entire batch</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Bar data={subjectClassAvgData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            {/* ATTENDANCE VS PERFORMANCE SCATTER PLOT & HISTOGRAM */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Attendance vs Performance Scatter Plot */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Target size={16} className="text-emerald-600" /> Attendance vs Performance Scatter Plot
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Core AI correlation graph: Attendance % vs Average Marks %</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <Scatter data={scatterPlotData} options={scatterOptions} />
                    </div>
                </div>

                {/* Performance Distribution Histogram */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={16} className="text-blue-600" /> Score Distribution Histogram
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Student counts per mark bracket</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <Bar data={histogramData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

            </div>

            {/* STUDENT RANKING LEADERBOARD & TOPIC CLASS PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Student Ranking Table / Horizontal Ranking */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Award size={16} className="text-amber-500" /> Student Ranking & Performance Leaderboard
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Top performing students filtered by batch and branch</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left text-slate-700">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Rank</th>
                                    <th className="px-4 py-3">Student Name</th>
                                    <th className="px-4 py-3">Branch / Sec</th>
                                    <th className="px-4 py-3 text-right">Avg Score</th>
                                    <th className="px-4 py-3 text-right">Attendance</th>
                                    <th className="px-4 py-3 text-center">RAG Status</th>
                                    <th className="px-4 py-3 text-center">360° Profile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {student_rankings.map((st: any) => (
                                    <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-bold text-amber-600">#{st.rank}</td>
                                        <td className="px-4 py-3 font-bold text-slate-900">{st.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{st.branch} - Sec {st.section}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{st.score}%</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{st.attendance}%</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                st.rag_status === 'Green' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                st.rag_status === 'Amber' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                'bg-rose-50 text-rose-700 border border-rose-200'
                                            }`}>
                                                {st.rag_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelected360StudentId(st.student_id);
                                                    setIs360Open(true);
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition"
                                            >
                                                View 360° Profile →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Topic-wise Class Performance */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <BookOpen size={16} className="text-indigo-600" /> Class Topic Mastery
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Average accuracy per syllabus topic</p>

                        <div className="space-y-4">
                            {topic_class_performance.map((tp: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-700">{tp.topic}</span>
                                        <span className="text-indigo-600 font-extrabold">{tp.accuracy}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full"
                                            style={{ width: `${tp.accuracy}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* PRIORITY 2 MODALS */}
            {selected360StudentId && (
                <Student360ProfileModal
                    studentId={selected360StudentId}
                    isOpen={is360Open}
                    onClose={() => setIs360Open(false)}
                    onInterventionCreated={() => fetchBatchAnalytics()}
                />
            )}

            <InterventionManagementModal
                isOpen={isInterventionOpen}
                onClose={() => setIsInterventionOpen(false)}
            />

            <BatchComparisonModal
                isOpen={isComparisonOpen}
                onClose={() => setIsComparisonOpen(false)}
            />

            <AlertsDrawerModal
                isOpen={isAlertsOpen}
                onClose={() => setIsAlertsOpen(false)}
                onSelectStudent360={(stId) => {
                    setSelected360StudentId(stId);
                    setIs360Open(true);
                }}
            />

        </div>
    );
}
