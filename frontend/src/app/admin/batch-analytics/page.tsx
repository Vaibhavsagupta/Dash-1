'use client';
import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    registerables
} from 'chart.js';
import { Bar, Doughnut, Scatter, Radar, Line, PolarArea } from 'react-chartjs-2';
import { API_BASE_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Users, Target, Activity, Award, ArrowRight,
    AlertCircle, ShieldCheck, Zap, BarChart3, Binary, Compass, HeartPulse,
    Eye, Filter, Maximize2, Search, User, Calendar, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

ChartJS.register(...registerables);

export default function BatchAnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRagTab, setActiveRagTab] = useState<'Red' | 'Amber' | 'Green'>('Red');
    const [scatterMode, setScatterMode] = useState<'score' | 'growth' | 'history'>('score');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedBatch, setSelectedBatch] = useState<string>('All');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                router.push('/admin/dashboard');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    useEffect(() => {
        let url = `${API_BASE_URL}/analytics/batch/comprehensive_stats?batch_filter=${selectedBatch}`;
        if (selectedDate) {
            url += `&date=${selectedDate}`;
        }

        const token = localStorage.getItem('access_token');
        setLoading(true);
        fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        })
            .then(res => res.json())
            .then(data => { setStats(data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, [selectedDate, selectedBatch]);

    if (loading) return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)]"></div>
                <p className="text-slate-400 font-medium animate-pulse">Computing Batch Intelligence...</p>
            </div>
        </div>
    );

    if (!stats || stats.error) return <div className="text-white p-10 bg-[#0f172a] h-screen">Failed to load stats. {stats?.error}</div>;

    const selectedStudent = stats.correlation_data?.find((s: any) => s.id === selectedStudentId);

    // 1. Attendance Intelligence (Enhanced Scatter)
    const correlationData = {
        datasets: [{
            label: scatterMode === 'score' ? 'Attendance vs Test Performance' : 'Attendance vs Qualitative Growth',
            data: (stats.correlation_data || []).map((s: any) => ({
                x: s?.attendance || 0,
                y: scatterMode === 'score' ? (s?.score || 0) : (s?.growth || 0)
            })),
            backgroundColor: (context: any) => {
                const index = context.dataIndex;
                const s = stats.correlation_data?.[index];
                if (selectedStudentId && s?.id === selectedStudentId) return '#fff';
                return scatterMode === 'score' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)';
            },
            borderColor: (context: any) => {
                const index = context.dataIndex;
                const s = stats.correlation_data?.[index];
                if (selectedStudentId && s?.id === selectedStudentId) return '#fff';
                return scatterMode === 'score' ? '#6366f1' : '#10b981';
            },
            borderWidth: (context: any) => {
                const index = context.dataIndex;
                const s = stats.correlation_data?.[index];
                return selectedStudentId && s?.id === selectedStudentId ? 4 : 1;
            },
            pointRadius: (context: any) => {
                const index = context.dataIndex;
                const s = stats.correlation_data?.[index];
                if (selectedStudentId && s?.id === selectedStudentId) return 18;
                return 8;
            },
            pointHoverRadius: (context: any) => {
                const index = context.dataIndex;
                const s = stats.correlation_data?.[index];
                if (selectedStudentId && s?.id === selectedStudentId) return 22;
                return 12;
            },
            pointHoverBorderWidth: 4,
            pointHoverBorderColor: '#fff',
        }]
    };

    // Other Graph Data (Keeping exactly as before)
    const subjectLabels = Object.keys(stats.subject_avgs || {});
    const subjectScores = Object.values(stats.subject_avgs || {});
    const subjectData = {
        labels: subjectLabels,
        datasets: [{
            label: 'Batch Average',
            data: subjectScores,
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 10,
            barThickness: 30
        }]
    };

    const radarData = {
        labels: ['Comm.', 'Fluency', 'Engagement', 'Knowledge', 'Confidence'],
        datasets: [
            {
                label: 'Baseline',
                data: [
                    stats.communication_comparison?.pre ?? 0,
                    stats.fluency_comparison?.pre ?? 0,
                    stats.engagement_comparison?.pre ?? 0,
                    stats.knowledge_comparison?.pre ?? 0,
                    stats.confidence_comparison?.pre ?? 0
                ],
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                pointBackgroundColor: '#ef4444',
            },
            {
                label: 'Current',
                data: [
                    stats.communication_comparison?.post ?? 0,
                    stats.fluency_comparison?.post ?? 0,
                    stats.engagement_comparison?.post ?? 0,
                    stats.knowledge_comparison?.post ?? 0,
                    stats.confidence_comparison?.post ?? 0
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10b981',
                borderWidth: 3,
                pointBackgroundColor: '#10b981',
            }
        ]
    };

    const ragData = {
        labels: ['Optimal', 'At Risk', 'Critical'],
        datasets: [{
            data: [stats.rag_distribution?.Green || 0, stats.rag_distribution?.Amber || 0, stats.rag_distribution?.Red || 0],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
            hoverOffset: 15,
            borderWidth: 0
        }]
    };

    const batchObservationData = {
        labels: ['Comm.', 'Engage', 'Knowledge', 'Conf.', 'Fluency'],
        datasets: [
            {
                label: 'Pre (Baseline)',
                data: [
                    stats.communication_comparison?.pre ?? 0,
                    stats.engagement_comparison?.pre ?? 0,
                    stats.knowledge_comparison?.pre ?? 0,
                    stats.confidence_comparison?.pre ?? 0,
                    stats.fluency_comparison?.pre ?? 0
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 8,
            },
            {
                label: 'Post (Latest)',
                data: [
                    stats.communication_comparison?.post ?? 0,
                    stats.engagement_comparison?.post ?? 0,
                    stats.knowledge_comparison?.post ?? 0,
                    stats.confidence_comparison?.post ?? 0,
                    stats.fluency_comparison?.post ?? 0
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 8,
            }
        ]
    };

    const polarBenchData = {
        labels: ['DSA', 'ML', 'QA', 'Projects', 'Mock'],
        datasets: [{
            data: [
                stats.subject_avgs?.["DSA"] || 0,
                stats.subject_avgs?.["ML"] || 0,
                stats.subject_avgs?.["QA"] || 0,
                stats.subject_avgs?.["Projects"] || 0,
                stats.subject_avgs?.["Mock Interview"] || 0
            ],
            backgroundColor: [
                'rgba(139, 92, 246, 0.6)', // Violet
                'rgba(56, 189, 248, 0.6)', // Sky
                'rgba(16, 185, 129, 0.6)', // Emerald
                'rgba(245, 158, 11, 0.6)', // Amber
                'rgba(239, 68, 68, 0.6)',  // Rose
            ],
            borderWidth: 0
        }]
    };

    const history = stats.batch_assessment_history || [];
    const batchAssessmentTrendData = {
        labels: history.map((a: any) => a?.name || 'Unnamed'),
        datasets: [
            {
                label: 'Technical',
                data: history.map((a: any) => a?.technical || 0),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                pointRadius: 6,
                fill: true,
            },
            {
                label: 'Math/Numerical',
                data: history.map((a: any) => a?.math || 0),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointRadius: 6,
            },
            {
                label: 'Logical Reasoning',
                data: history.map((a: any) => a?.logic || 0),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                pointRadius: 6,
            }
        ]
    };

    const preLevel = stats.level_comparison?.pre ?? 0;
    const postLevel = stats.level_comparison?.post ?? 0;
    const growthPercent = preLevel > 0 ? (((postLevel - preLevel) / preLevel) * 100).toFixed(1) : (postLevel > 0 ? "100" : "0.0");

    return (
        <div className="text-slate-100 selection:bg-indigo-500/30">
            {/* Sticky Back Button */}
            <div className="fixed bottom-8 left-8 z-[100] hidden md:block">
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex items-center gap-3 px-6 py-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group shadow-2xl"
                >
                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Navigation</span>
                        <span className="text-sm font-bold">Back to Dashboard</span>
                    </div>
                    <div className="ml-4 px-2 py-1 bg-slate-800 rounded text-[10px] font-black text-slate-500 border border-slate-700">
                        ←
                    </div>
                </button>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg"><Activity className="text-indigo-400" size={24} /></div>
                        <span className="text-indigo-400 font-bold tracking-tighter uppercase text-sm text-shadow-glow">Universal Analytics Hub</span>
                    </motion.div>
                    <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                        Behavioral Intelligence
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricCard title="Progression" value={`+${growthPercent}%`} sub="Skill Evolution" icon={<TrendingUp size={24} />} color="text-indigo-400" />
                <MetricCard title="Avg Attendance" value="94.2%" sub="Global Rate" icon={<Users size={24} />} color="text-sky-400" />
                <MetricCard title="At Risk" value={stats.rag_distribution?.Red ?? 0} sub="Pending Intervention" icon={<AlertCircle size={24} />} color="text-rose-400" />
                <MetricCard title="Health" value={`${stats.student_count > 0 ? ((stats.rag_distribution?.Green ?? 0) / stats.student_count * 100).toFixed(0) : 0}%`} sub="Optimal Threshold" icon={<ShieldCheck size={24} />} color="text-emerald-400" />
                <MetricCard title="Obs. Growth" value={`+${stats.total_improvement ?? 0}`} sub="Avg Point Gain" icon={<Compass size={24} />} color="text-blue-400" />
            </div>

            {/* PRIMARY ATTENDANCE SCATTER SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <Card className="lg:col-span-12" title="Attendance Intelligence Scatter" subtitle="Behavioral Mapping: Correlation between student participation frequency and academic success.">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex gap-4 p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
                            <button onClick={() => setScatterMode('score')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scatterMode === 'score' ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}>vs Scores</button>
                            <button onClick={() => setScatterMode('growth')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${scatterMode === 'growth' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}>vs Growth</button>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="pl-4 pr-8 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-all uppercase tracking-wide"
                            >
                                <option value="All">All Batches</option>
                                <option value="Batch 1">Batch 1</option>
                                <option value="Batch 2">Batch 2</option>
                                <option value="Batch 3">Batch 3</option>
                            </select>

                            <div className="relative group w-full md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-all transition-colors"
                                >
                                    <option value="">Select Student to Track...</option>
                                    {(stats.correlation_data || [])
                                        .filter((s: any) => s && s.name)
                                        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                                        .map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Date Selector (Calendar) */}
                            <div className="relative group min-w-[140px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                                    <Calendar size={14} />
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-all uppercase tracking-wide h-[42px] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                                />
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate('')}
                                        className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white rounded-full p-1 border border-slate-700 shadow-lg z-10 transition-colors"
                                        title="Clear Date (Go Live)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                )}
                            </div>
                            <AnimatePresence>
                                {selectedStudent && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                        className="hidden xl:flex items-center gap-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Attendance Rate</span>
                                            <span className="text-sm font-black text-white">{selectedStudent.attendance}%</span>
                                        </div>
                                        <div className="flex flex-col border-l border-indigo-500/20 pl-4">
                                            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Perf. Rank</span>
                                            <span className="text-sm font-black text-white">Top 15%</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="h-[550px]">
                        <Scatter
                            data={correlationData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        title: { display: true, text: 'ATTENDANCE PERCENTAGE (%)', color: '#64748b', font: { weight: 'bold', size: 10 } },
                                        grid: { color: 'rgba(255,255,255,0.02)' },
                                        ticks: { color: '#94a3b8' },
                                        min: 0, max: 105
                                    },
                                    y: {
                                        title: { display: true, text: scatterMode === 'score' ? 'AVERAGE SCORE' : 'NET GROWTH DELTA', color: '#64748b', font: { weight: 'bold', size: 10 } },
                                        grid: { color: 'rgba(255,255,255,0.02)' },
                                        ticks: { color: '#94a3b8' }
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: '#0f172a',
                                        titleColor: '#fff',
                                        bodyColor: '#94a3b8',
                                        padding: 15,
                                        cornerRadius: 15,
                                        borderColor: '#1e293b',
                                        borderWidth: 1,
                                        callbacks: {
                                            label: (ctx: any) => {
                                                const s = stats.correlation_data?.[ctx.dataIndex];
                                                if (!s) return 'Point data missing';
                                                return [
                                                    ` Student: ${s.name}`,
                                                    ` Attendance: ${s.attendance}%`,
                                                    ` ${scatterMode === 'score' ? 'Avg Score' : 'Net Growth'}: ${ctx.formattedValue}`
                                                ];
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* ALL OTHER GRAPHS (Keeping exactly as before) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <Card className="lg:col-span-12 xl:col-span-8" title="Hard Skill Domain Mastery" subtitle="Distribution of batch technical proficiency across sectors.">
                    <div className="h-[400px]">
                        <Bar data={subjectData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } } }} />
                    </div>
                </Card>
                <Card className="lg:col-span-12 xl:col-span-4" title="Qualitative Shift Radar" subtitle="Pillar-by-pillar shift from Baseline to Target.">
                    <div className="h-[350px] flex justify-center py-4">
                        <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: 'rgba(255,255,255,0.05)' }, grid: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: '#94a3b8', font: { size: 10, weight: 600 } }, ticks: { display: false }, suggestedMin: 0, suggestedMax: 10 } }, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } } }} />
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-6" title="Percentile Benchmark" subtitle="Aggregated whole-batch performance standing across domains.">
                    <div className="h-[400px] flex justify-center py-6">
                        <PolarArea
                            data={polarBenchData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    r: {
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { display: false }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#94a3b8', font: { size: 10, weight: 600 }, padding: 20, usePointStyle: true }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-6" title="Observation Growth (Batch-wide)" subtitle="Aggregated subject-wise shift in soft skill proficiency.">
                    <div className="flex gap-8 mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 w-fit">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Pre-Score</div>
                            <div className="text-xl font-black text-slate-300">{stats.avg_pre_score || 0}</div>
                        </div>
                        <div className="border-l border-slate-800 pl-8">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Post-Score</div>
                            <div className="text-xl font-black text-emerald-400">{stats.avg_post_score || 0}</div>
                        </div>
                        <div className="border-l border-slate-800 pl-8">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Net Gain</div>
                            <div className="text-xl font-black text-indigo-400">+{stats.total_improvement || 0}</div>
                        </div>
                    </div>
                    <div className="h-[310px]">
                        <Bar
                            data={batchObservationData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#94a3b8', font: { size: 11, weight: 600 }, usePointStyle: true, padding: 20 }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10,
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { color: '#64748b' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8', font: { weight: 'bold' } }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-12" title="Historical Assessment Trend" subtitle="Batch-wide progression across successive assessments (Assessment 1 to 3).">
                    <div className="h-[400px]">
                        <Line
                            data={batchAssessmentTrendData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { color: '#64748b' }
                                    },
                                    x: {
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { color: '#94a3b8', font: { weight: 'bold' } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#94a3b8', font: { size: 12, weight: 600 }, usePointStyle: true, padding: 30 }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-12" title="Velocity of Improvement" subtitle="Students ranked by absolute growth speed.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 py-2">
                        {(stats.top_improvers || []).slice(0, 10).map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <span className="text-slate-500 font-mono text-sm w-4 italic">{i + 1}.</span>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors uppercase text-xs tracking-wider">{s?.name || 'Unknown'}</span>
                                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">+{s?.growth || 0} PT GROWTH</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((s?.post || 0) / 40) * 100)}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-7" title="Precision Intervention List" subtitle="Categorized registry for targeted teacher-led academic support.">
                    <div className="mb-6 flex gap-2 p-1 bg-slate-900 rounded-xl w-fit border border-slate-800">
                        {['Red', 'Amber', 'Green'].map((tab) => (
                            <button key={tab} onClick={() => setActiveRagTab(tab as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeRagTab === tab ? tab === 'Red' ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : tab === 'Amber' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                {tab} ({stats.rag_students?.[tab]?.length || 0})
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {(stats.rag_students?.[activeRagTab] || []).map((s: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all group">
                                <div className="flex flex-col"><span className="font-black text-slate-200 group-hover:text-white transition-colors uppercase text-sm">{s?.name || 'Unknown'}</span><span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s?.id || 'N/A'}</span></div>
                                <div className="flex gap-8"><div className="text-right"><div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Avg Prof.</div><div className="text-sm font-black text-slate-300">{s?.avg_score || 0}%</div></div><div className="text-right border-l border-slate-700 pl-8"><div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Attendance</div><div className="text-sm font-black text-slate-300">{s?.attendance || 0}%</div></div></div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-5" title="Resiliency Distribution" subtitle="Predictive risk identification based on comprehensive metric density.">
                    <div className="flex flex-col items-center gap-12 py-4">
                        <div className="h-64 w-64 relative">
                            <Doughnut data={ragData} options={{ responsive: true, maintainAspectRatio: false, cutout: '85%', plugins: { legend: { display: false } } }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <Zap className="text-emerald-400 mb-1" size={32} />
                                <span className="text-4xl font-black text-white">
                                    {stats.student_count > 0 ? ((stats.rag_distribution?.Green ?? 0) / stats.student_count * 100).toFixed(0) : 0}%
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">Batch Resiliency</span>
                            </div>
                        </div>
                        <div className="space-y-4 w-full px-4">
                            <HealthRow label="Optimal Progression" count={stats.rag_distribution?.Green ?? 0} color="bg-emerald-500" />
                            <HealthRow label="Moderate Risk" count={stats.rag_distribution?.Amber ?? 0} color="bg-amber-500" />
                            <HealthRow label="Critical Attention" count={stats.rag_distribution?.Red ?? 0} color="bg-rose-500" />
                        </div>
                    </div>
                </Card>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                .text-shadow-glow { text-shadow: 0 0 10px rgba(129, 140, 248, 0.5); }
            `}</style>
        </div>
    );
}

function MetricCard({ title, value, sub, icon, color }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-[#1e293b]/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity scale-[3]">{icon}</div>
            <div className={`p-3 rounded-2xl bg-slate-900 w-fit mb-6 border border-slate-800 ${color}`}>{icon}</div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{title}</h3>
            <div className="flex items-baseline gap-2 mt-4"><span className="text-4xl font-black text-white leading-none">{value}</span></div>
            <p className="text-slate-500 text-[9px] font-bold mt-2 uppercase tracking-widest">{sub}</p>
        </motion.div>
    );
}

function Card({ children, className, title, subtitle }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-[#1e293b]/10 backdrop-blur-md p-10 rounded-[4rem] border border-slate-800 shadow-2xl ${className}`}>
            <div className="mb-10"><h3 className="text-2xl font-black text-white tracking-tight leading-none mb-3">{title}</h3><p className="text-slate-500 text-sm font-medium pr-12">{subtitle}</p></div>
            {children}
        </motion.div>
    );
}

function HealthRow({ label, count, color }: any) {
    return (
        <div className="flex justify-between items-center p-5 rounded-3xl bg-slate-900/60 border border-slate-800 text-sm">
            <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${color}`}></div><span className="font-bold text-slate-300 uppercase tracking-wider text-xs">{label}</span></div>
            <div className="flex flex-col items-end"><span className="font-black text-white text-xl">{count || 0}</span><span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Registry</span></div>
        </div>
    );
}
