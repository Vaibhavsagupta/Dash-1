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

export default function TeacherVisualAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states for Student Rankings & Batch Selection
    const [branchFilter, setBranchFilter] = useState<string>('All');
    const [semesterFilter, setSemesterFilter] = useState<string>('All');

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

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
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

        </div>
    );
}
