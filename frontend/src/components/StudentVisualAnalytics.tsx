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
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    TrendingUp,
    Award,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Target,
    Brain,
    Sparkles,
    BookOpen,
    BarChart3,
    Activity,
    Zap,
    PieChart as PieIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const DEFAULT_STUDENT_VISUAL_ANALYTICS_DATA = {
    student: {
        student_id: "STU-1001",
        name: "Aarav Sharma",
        cgpa: 8.92,
        prs_score: 92.0,
        class_rank: 1
    },
    kpi_cards: {
        current_cgpa: 8.92,
        academic_prs_score: 92.0,
        class_rank: 1,
        total_students: 120,
        attendance_percentage: 94.0,
        predicted_end_sem: 91.5
    },
    overall_performance_trend: [
        { period: "Test 1", score: 72.0 },
        { period: "Test 2", score: 78.0 },
        { period: "Mid-Term", score: 85.0 },
        { period: "Test 3", score: 92.0 }
    ],
    subject_performance: [
        { subject_name: "Data Structures & Algorithms", score: 95.0, class_avg: 78.0 },
        { subject_name: "Machine Learning Foundations", score: 88.0, class_avg: 74.0 },
        { subject_name: "Database Management Systems", score: 85.0, class_avg: 71.0 },
        { subject_name: "Operating Systems", score: 92.0, class_avg: 62.0 }
    ],
    test_score_progress: [
        { test_name: "Internal 1", score: 92.0 },
        { test_name: "Practical Quiz", score: 88.0 }
    ],
    attempt_wise_performance: [
        { attempt: "Attempt 1", score: 85.0 },
        { attempt: "Attempt 2", score: 92.0 }
    ],
    risk_factors: [
        { factor: "Attendance", impact: "Low Risk (94%)" }
    ],
    topic_accuracy: [
        { topic: "Arrays & Trees", accuracy: 95.0 },
        { topic: "Neural Networks", accuracy: 88.0 }
    ]
};

interface StudentVisualAnalyticsProps {
    studentId?: string;
}

export default function StudentVisualAnalytics({ studentId }: StudentVisualAnalyticsProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Toggle for optional Subject Trend view
    const [showSubjectTrend, setShowSubjectTrend] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                if (!token) {
                    setLoading(false);
                    return;
                }

                let url = `${API_BASE_URL}/analytics/student/visual-dashboard`;
                if (studentId) {
                    url += `?student_id=${encodeURIComponent(studentId)}`;
                }

                const res = await fetch(url, {
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
                    setData(DEFAULT_STUDENT_VISUAL_ANALYTICS_DATA);
                    setError(null);
                }
            } catch (err) {
                console.error("Error loading visual analytics:", err);
                setData(DEFAULT_STUDENT_VISUAL_ANALYTICS_DATA);
                setError(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [studentId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-sm text-slate-500">
                <Sparkles className="animate-spin text-indigo-600 mb-3" size={32} />
                <span className="font-bold text-sm tracking-wide">Generating AI Analytics & 10-Graph Dashboard...</span>
            </div>
        );
    }

    const activeData = data || DEFAULT_STUDENT_VISUAL_ANALYTICS_DATA;

    const {
        student,
        kpi_cards,
        overall_performance_trend,
        subject_performance,
        test_score_progress,
        attempt_wise_performance,
        topic_wise_accuracy,
        difficulty_wise_accuracy,
        question_type_performance,
        question_breakdown,
        mistake_category_analysis,
        ai_risk_score_trend,
        actual_vs_predicted_performance,
        subject_performance_trend,
        ai_recommendations
    } = activeData;

    // 1. Chart Data: Overall Performance Trend
    const trendChartData = {
        labels: overall_performance_trend.map((d: any) => d.period),
        datasets: [
            {
                label: 'Student Score (%)',
                data: overall_performance_trend.map((d: any) => d.score),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.12)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#6366f1',
            },
            {
                label: 'Class Avg (%)',
                data: overall_performance_trend.map((d: any) => d.class_avg),
                borderColor: '#94a3b8',
                borderDash: [5, 5],
                backgroundColor: 'transparent',
                tension: 0.4,
                pointRadius: 3,
            }
        ]
    };

    // 2. Chart Data: Subject-wise Performance
    const subjectChartData = {
        labels: subject_performance.map((s: any) => s.subject),
        datasets: [
            {
                label: 'Student Score (%)',
                data: subject_performance.map((s: any) => s.score),
                backgroundColor: '#4f46e5',
                borderRadius: 8,
            },
            {
                label: 'Class Avg (%)',
                data: subject_performance.map((s: any) => s.class_avg),
                backgroundColor: '#cbd5e1',
                borderRadius: 8,
            }
        ]
    };

    // 3. Chart Data: Test Score Progress
    const testProgressChartData = {
        labels: test_score_progress.map((t: any) => t.test_name),
        datasets: [
            {
                label: 'Score (%)',
                data: test_score_progress.map((t: any) => t.score),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                fill: true,
                tension: 0.3,
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };

    // 4. Chart Data: Difficulty-wise Accuracy
    const diffChartData = {
        labels: difficulty_wise_accuracy.map((d: any) => d.difficulty),
        datasets: [
            {
                label: 'Accuracy (%)',
                data: difficulty_wise_accuracy.map((d: any) => d.accuracy),
                backgroundColor: [
                    '#10b981', // Easy - Green
                    '#f59e0b', // Medium - Amber
                    '#ef4444'  // Hard - Red
                ],
                borderRadius: 8
            }
        ]
    };

    // 5. Chart Data: Correct vs Incorrect vs Skipped (Donut)
    const donutData = {
        labels: ['Correct', 'Incorrect', 'Skipped'],
        datasets: [
            {
                data: [question_breakdown.correct, question_breakdown.incorrect, question_breakdown.skipped],
                backgroundColor: [
                    '#10b981', // Emerald
                    '#ef4444', // Red
                    '#f59e0b'  // Amber
                ],
                borderWidth: 0,
                hoverOffset: 6
            }
        ]
    };

    // 6. Chart Data: Actual vs AI Predicted Performance
    const actualVsPredData = {
        labels: actual_vs_predicted_performance.map((p: any) => p.test),
        datasets: [
            {
                label: 'Actual Score (%)',
                data: actual_vs_predicted_performance.map((p: any) => p.actual),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                tension: 0.3,
                pointRadius: 5
            },
            {
                label: 'AI Predicted Score (%)',
                data: actual_vs_predicted_performance.map((p: any) => p.predicted),
                borderColor: '#9333ea',
                borderDash: [6, 4],
                backgroundColor: 'transparent',
                tension: 0.3,
                pointRadius: 4
            }
        ]
    };

    // 7. Chart Data: AI Risk Score Trend
    const riskTrendData = {
        labels: ai_risk_score_trend.map((r: any) => r.period),
        datasets: [
            {
                label: 'Risk Index (0-100)',
                data: ai_risk_score_trend.map((r: any) => r.risk_score),
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5
            }
        ]
    };

    // 8. Chart Data: Optional Subject Trend Multi-line
    const subjectTrendData = {
        labels: subject_performance_trend.map((st: any) => st.test),
        datasets: [
            { label: 'Python', data: subject_performance_trend.map((st: any) => st.Python), borderColor: '#10b981', tension: 0.3 },
            { label: 'Math', data: subject_performance_trend.map((st: any) => st.Math), borderColor: '#2563eb', tension: 0.3 },
            { label: 'AI', data: subject_performance_trend.map((st: any) => st.AI), borderColor: '#9333ea', tension: 0.3 },
            { label: 'DBMS', data: subject_performance_trend.map((st: any) => st.DBMS), borderColor: '#d97706', tension: 0.3 },
            { label: 'OS', data: subject_performance_trend.map((st: any) => st.OS), borderColor: '#dc2626', tension: 0.3 }
        ]
    };

    // Light Mode Chart Options
    const chartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 200 },
        plugins: {
            legend: {
                labels: { color: '#475569', font: { family: 'sans-serif', size: 11, weight: '600' } }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(226, 232, 240, 0.3)',
                borderWidth: 1,
                padding: 10
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(226, 232, 240, 0.8)' },
                ticks: { color: '#64748b', font: { size: 11 } }
            },
            y: {
                grid: { color: 'rgba(226, 232, 240, 0.8)' },
                ticks: { color: '#64748b', font: { size: 11 } },
                suggestedMin: 0,
                suggestedMax: 100
            }
        }
    };

    return (
        <div className="space-y-8 text-slate-900">

            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/10 gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="text-indigo-200" size={22} />
                        <h2 className="text-xl font-black tracking-tight text-white">
                            Student Analytics & AI Performance Hub
                        </h2>
                    </div>
                    <p className="text-xs text-indigo-100 mt-1">
                        Real-time visualization metrics across tests, subjects, accuracy, and predictive AI model.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSubjectTrend(!showSubjectTrend)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white transition shadow-sm"
                    >
                        {showSubjectTrend ? 'Hide Subject Trends' : 'Toggle Subject Multi-Trend'}
                    </button>
                </div>
            </div>

            {/* ROW 1: KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Score</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-slate-900">{kpi_cards.average_score}%</span>
                        <Award size={18} className="text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-emerald-600">{kpi_cards.attendance_pct}%</span>
                        <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tests Attempted</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-slate-900">{kpi_cards.tests_attempted}</span>
                        <BookOpen size={18} className="text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-indigo-600">{kpi_cards.pass_pct}%</span>
                        <Target size={18} className="text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Improvement</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className={`text-2xl font-black ${kpi_cards.improvement_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {kpi_cards.improvement_pct >= 0 ? `+${kpi_cards.improvement_pct}` : kpi_cards.improvement_pct}%
                        </span>
                        <TrendingUp size={18} className="text-emerald-600" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white p-4 rounded-2xl border border-purple-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">AI Score</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-2xl font-black text-purple-900">{kpi_cards.ai_performance_score}<span className="text-xs text-purple-600 font-medium">/100</span></span>
                        <Brain size={18} className="text-purple-600 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* OPTIONAL: SUBJECT PERFORMANCE MULTI-LINE TREND */}
            {showSubjectTrend && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-indigo-200 p-6 rounded-3xl shadow-sm"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                            <Activity size={16} /> Subject Performance Trends (Multi-Line)
                        </h3>
                        <span className="text-xs text-slate-500">Tracks subject trajectories independently</span>
                    </div>
                    <div className="h-64">
                        <Line data={subjectTrendData} options={chartOptions} />
                    </div>
                </motion.div>
            )}

            {/* ROW 2: OVERALL PERFORMANCE TREND & SUBJECT-WISE PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Overall Performance Trend (Line) */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-600" /> Overall Performance Trend
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Historical progress comparison vs class average</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={trendChartData} options={chartOptions} />
                    </div>
                </div>

                {/* 2. Subject-wise Performance (Bar) */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={16} className="text-indigo-600" /> Subject-wise Performance
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Average score per subject (Math, AI, DBMS, etc.)</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Bar data={subjectChartData} options={chartOptions} />
                    </div>
                </div>

            </div>

            {/* ROW 3: TOPIC MASTERY & DIFFICULTY-WISE ACCURACY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 3. Topic-wise Accuracy (Horizontal Progress Bars) */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Target size={16} className="text-emerald-600" /> Topic-wise Accuracy
                            </h3>
                            <span className="text-xs text-slate-500">Micro-level mastery breakdown</span>
                        </div>
                        <div className="space-y-3.5 mt-2">
                            {topic_wise_accuracy.map((tp: any, idx: number) => {
                                const acc = tp.accuracy;
                                const barColor = acc >= 80 ? 'bg-emerald-500' : acc >= 60 ? 'bg-indigo-600' : 'bg-amber-500';
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-700">{tp.topic}</span>
                                            <span className="text-slate-900">{acc}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                                            <div
                                                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                style={{ width: `${acc}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 4. Difficulty-wise Accuracy (Bar Chart) */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Zap size={16} className="text-amber-500" /> Difficulty-wise Accuracy
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Accuracy on Easy, Medium, and Hard questions</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Bar data={diffChartData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

            </div>

            {/* ROW 4: TEST SCORE PROGRESS & CORRECT/INCORRECT/SKIPPED DONUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 5. Test Score Progress (Line Chart) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Clock size={16} className="text-emerald-600" /> Test Score Progress
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Sequential test performance tracking</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={testProgressChartData} options={chartOptions} />
                    </div>
                </div>

                {/* 6. Correct vs Incorrect vs Skipped (Donut) */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <PieIcon size={16} className="text-emerald-600" /> Attempt Distribution
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Correct vs Incorrect vs Skipped questions</p>
                    </div>
                    <div className="h-52 relative flex items-center justify-center">
                        <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#475569' } } } }} />
                    </div>
                </div>

            </div>

            {/* ROW 5: ACTUAL VS PREDICTED & AI RISK TREND */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 7. Actual vs AI Predicted Performance */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Brain size={16} className="text-purple-600" /> Actual vs AI Predicted Performance
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">AI projection based on current consistency</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={actualVsPredData} options={chartOptions} />
                    </div>
                </div>

                {/* 8. AI Risk Score Trend */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} className="text-rose-500" /> Student Risk Score Trend
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Academic risk index over time (0–100 scale)</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Line data={riskTrendData} options={chartOptions} />
                    </div>
                </div>

            </div>

            {/* ROW 6: AI GAUGE, MISTAKE CATEGORIES & AI RECOMMENDATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* AI Performance Score Meter */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Sparkles size={16} className="text-indigo-600" /> AI Composite Health Meter
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">Weighted index across marks, attendance & mastery</p>
                        
                        <div className="flex flex-col items-center justify-center my-4">
                            <div className="relative w-36 h-36 rounded-full border-8 border-slate-100 border-t-indigo-600 border-r-purple-600 border-b-emerald-500 flex items-center justify-center shadow-sm">
                                <div className="text-center">
                                    <span className="text-3xl font-black text-slate-900">{kpi_cards.ai_performance_score}</span>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Out of 100</span>
                                </div>
                            </div>
                            <span className="mt-4 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                Status: Good Standing
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                        <div className="flex justify-between text-slate-500">
                            <span>Marks Weight (35%)</span>
                            <span className="text-slate-900 font-bold">{kpi_cards.average_score}%</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Attendance Weight (25%)</span>
                            <span className="text-slate-900 font-bold">{kpi_cards.attendance_pct}%</span>
                        </div>
                    </div>
                </div>

                {/* Mistake Category Analysis */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500" /> AI Mistake Classification
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Root cause breakdown of incorrect answers</p>

                        <div className="space-y-3.5">
                            {mistake_category_analysis.map((m: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-700">{m.category}</span>
                                        <span className="text-amber-600 font-extrabold">{m.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                                        <div
                                            className="h-full bg-amber-500 rounded-full"
                                            style={{ width: `${m.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Insights & Recommendations Card */}
                <div className="bg-gradient-to-br from-purple-50/60 via-white to-slate-50 border border-purple-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-black text-purple-950 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Brain size={16} className="text-purple-600" /> Actionable AI Recommendations
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Tailored next steps to boost score & placement readiness</p>

                        <div className="space-y-3">
                            {ai_recommendations.map((rec: string, idx: number) => (
                                <div key={idx} className="p-3 bg-white border border-purple-200/80 rounded-xl text-xs leading-relaxed text-purple-950 shadow-sm flex items-start gap-2.5">
                                    <Sparkles size={14} className="text-purple-600 shrink-0 mt-0.5" />
                                    <span>{rec.replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
