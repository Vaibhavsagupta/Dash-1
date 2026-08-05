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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 shadow-md"></div>
                <p className="text-slate-600 font-bold animate-pulse">Computing Batch Intelligence...</p>
            </div>
        </div>
    );

    if (!stats || stats.error) return <div className="text-slate-900 p-10 bg-slate-50 h-screen font-bold">Failed to load stats. {stats?.error}</div>;

    const selectedStudent = stats.correlation_data?.find((s: any) => s.id === selectedStudentId);

    // 1. Attendance Tier Performance Calculation
    const attendanceTiers = [
        { label: '< 60% Attendance', min: 0, max: 60, color: 'rgba(239, 68, 68, 0.85)', badge: 'bg-red-100 text-red-700 border-red-200' },
        { label: '60% - 75% Attendance', min: 60, max: 75, color: 'rgba(245, 158, 11, 0.85)', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
        { label: '75% - 90% Attendance', min: 75, max: 90, color: 'rgba(79, 70, 229, 0.85)', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
        { label: '90% - 100% Attendance', min: 90, max: 101, color: 'rgba(16, 185, 129, 0.85)', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    ].map(tier => {
        const matching = (stats.correlation_data || []).filter((s: any) => (s?.attendance || 0) >= tier.min && (s?.attendance || 0) < tier.max);
        const count = matching.length;
        const avgScore = count > 0 ? Math.round(matching.reduce((acc: number, cur: any) => acc + (cur.score || 0), 0) / count) : 0;
        const avgGrowth = count > 0 ? Math.round(matching.reduce((acc: number, cur: any) => acc + (cur.growth || 0), 0) / count) : 0;
        return { ...tier, count, avgScore, avgGrowth };
    });

    const attendanceImpactChartData = {
        labels: attendanceTiers.map(t => t.label),
        datasets: [
            {
                label: 'Average Test Score (%)',
                data: attendanceTiers.map(t => t.avgScore),
                backgroundColor: attendanceTiers.map(t => t.color),
                borderRadius: 10,
                barThickness: 44
            },
            {
                label: 'Average Growth Delta (+pts)',
                data: attendanceTiers.map(t => t.avgGrowth),
                backgroundColor: 'rgba(147, 51, 234, 0.25)',
                borderColor: '#9333ea',
                borderWidth: 2,
                borderRadius: 10,
                barThickness: 44
            }
        ]
    };

    // Other Graph Data
    const subjectLabels = Object.keys(stats.subject_avgs || {});
    const subjectScores = Object.values(stats.subject_avgs || {});
    const subjectData = {
        labels: subjectLabels,
        datasets: [{
            label: 'Batch Average',
            data: subjectScores,
            backgroundColor: 'rgba(79, 70, 229, 0.7)',
            borderColor: '#4f46e5',
            borderWidth: 2,
            borderRadius: 10,
            barThickness: 32
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
                borderColor: 'rgba(239, 68, 68, 0.6)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
                backgroundColor: 'rgba(79, 70, 229, 0.75)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.75)',
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
                'rgba(79, 70, 229, 0.7)',
                'rgba(14, 165, 233, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(239, 68, 68, 0.7)',
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
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
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
        <div className="text-slate-900 bg-slate-50 min-h-screen p-6 md:p-10">
            {/* Sticky Back Button */}
            <div className="fixed bottom-8 left-8 z-[100] hidden md:block">
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group shadow-md"
                >
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Navigation</span>
                        <span className="text-sm font-bold text-slate-900">Back to Dashboard</span>
                    </div>
                    <div className="ml-4 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200">
                        ←
                    </div>
                </button>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100"><Activity className="text-indigo-600" size={24} /></div>
                        <span className="text-indigo-600 font-bold tracking-tighter uppercase text-xs">Universal Analytics Hub</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 bg-clip-text text-transparent">
                        Behavioral Intelligence
                    </h1>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <MetricCard title="Progression" value={`+${growthPercent}%`} sub="Skill Evolution" icon={<TrendingUp size={24} />} color="text-indigo-600" />
                <MetricCard title="Avg Attendance" value="94.2%" sub="Global Rate" icon={<Users size={24} />} color="text-sky-600" />
                <MetricCard title="At Risk" value={stats.rag_distribution?.Red ?? 0} sub="Pending Intervention" icon={<AlertCircle size={24} />} color="text-rose-600" />
                <MetricCard title="Health" value={`${stats.student_count > 0 ? ((stats.rag_distribution?.Green ?? 0) / stats.student_count * 100).toFixed(0) : 0}%`} sub="Optimal Threshold" icon={<ShieldCheck size={24} />} color="text-emerald-600" />
                <MetricCard title="Obs. Growth" value={`+${stats.total_improvement ?? 0}`} sub="Avg Point Gain" icon={<Compass size={24} />} color="text-indigo-600" />
            </div>

            {/* PRIMARY ATTENDANCE IMPACT BAR CHART SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <Card className="lg:col-span-12" title="Attendance Impact & Performance Analysis" subtitle="Direct correlation between student attendance brackets and academic test performance.">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer uppercase tracking-wide shadow-sm"
                            >
                                <option value="All">All Batches</option>
                                <option value="Batch 1">Batch 1</option>
                                <option value="Batch 2">Batch 2</option>
                                <option value="Batch 3">Batch 3</option>
                            </select>

                            <div className="relative group w-full md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer shadow-sm"
                                >
                                    <option value="">Select Student to Track...</option>
                                    {(stats.correlation_data || [])
                                        .filter((s: any) => s && s.name)
                                        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
                                        .map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.attendance}%)</option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Date Selector */}
                            <div className="relative group min-w-[140px]">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar size={14} />
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 cursor-pointer uppercase tracking-wide h-[38px] shadow-sm"
                                />
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate('')}
                                        className="absolute -top-2 -right-2 bg-white text-slate-500 hover:text-slate-900 rounded-full p-1 border border-slate-200 shadow-md z-10 transition-colors"
                                        title="Clear Date"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attendance Tier Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {attendanceTiers.map((tier, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-sm hover:border-indigo-300 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tier.badge}`}>
                                        {tier.label}
                                    </span>
                                    <span className="text-xs text-slate-500 font-bold">{tier.count} Students</span>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-extrabold text-slate-900">{tier.avgScore}% <span className="text-xs font-normal text-slate-500">Avg Score</span></div>
                                    <div className="text-xs text-purple-700 font-semibold mt-0.5">+{tier.avgGrowth} pts avg growth</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Clear Bar Chart */}
                    <div className="h-[380px]">
                        <Bar
                            data={attendanceImpactChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#475569', font: { weight: 'bold', size: 11 } }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: { color: '#e2e8f0' },
                                        ticks: { color: '#475569', font: { size: 11 } },
                                        title: { display: true, text: 'AVERAGE SCORE (%)', color: '#64748b', font: { weight: 'bold', size: 10 } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top',
                                        labels: { color: '#334155', font: { weight: 'bold', size: 11 } }
                                    },
                                    tooltip: {
                                        backgroundColor: '#ffffff',
                                        titleColor: '#0f172a',
                                        bodyColor: '#334155',
                                        borderColor: '#cbd5e1',
                                        borderWidth: 1,
                                        padding: 12,
                                        cornerRadius: 12
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* OTHER GRAPHS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                <Card className="lg:col-span-12 xl:col-span-8" title="Hard Skill Domain Mastery" subtitle="Distribution of batch technical proficiency across sectors.">
                    <div className="h-[400px]">
                        <Bar data={subjectData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, grid: { color: '#e2e8f0' }, ticks: { color: '#475569' } }, x: { grid: { display: false }, ticks: { color: '#334155', font: { weight: 'bold' } } } } }} />
                    </div>
                </Card>
                <Card className="lg:col-span-12 xl:col-span-4" title="Qualitative Shift Radar" subtitle="Pillar-by-pillar shift from Baseline to Target.">
                    <div className="h-[350px] flex justify-center py-4">
                        <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: '#e2e8f0' }, grid: { color: '#e2e8f0' }, pointLabels: { color: '#334155', font: { size: 10, weight: 600 } }, ticks: { display: false }, suggestedMin: 0, suggestedMax: 10 } }, plugins: { legend: { position: 'bottom', labels: { color: '#334155', font: { size: 10 } } } } }} />
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
                                        grid: { color: '#e2e8f0' },
                                        ticks: { display: false }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#334155', font: { size: 10, weight: 600 }, padding: 20, usePointStyle: true }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-6" title="Observation Growth (Batch-wide)" subtitle="Aggregated subject-wise shift in soft skill proficiency.">
                    <div className="flex gap-8 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 w-fit shadow-sm">
                        <div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Pre-Score</div>
                            <div className="text-xl font-black text-slate-900">{stats.avg_pre_score || 0}</div>
                        </div>
                        <div className="border-l border-slate-200 pl-8">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Post-Score</div>
                            <div className="text-xl font-black text-emerald-600">{stats.avg_post_score || 0}</div>
                        </div>
                        <div className="border-l border-slate-200 pl-8">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Net Gain</div>
                            <div className="text-xl font-black text-indigo-600">+{stats.total_improvement || 0}</div>
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
                                        labels: { color: '#334155', font: { size: 11, weight: 600 }, usePointStyle: true, padding: 20 }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10,
                                        grid: { color: '#e2e8f0' },
                                        ticks: { color: '#475569' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#334155', font: { weight: 'bold' } }
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
                                        grid: { color: '#e2e8f0' },
                                        ticks: { color: '#475569' }
                                    },
                                    x: {
                                        grid: { color: '#e2e8f0' },
                                        ticks: { color: '#334155', font: { weight: 'bold' } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: '#334155', font: { size: 12, weight: 600 }, usePointStyle: true, padding: 30 }
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
                                <span className="text-slate-400 font-mono text-sm w-4 italic">{i + 1}.</span>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-wider">{s?.name || 'Unknown'}</span>
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">+{s?.growth || 0} PT GROWTH</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((s?.post || 0) / 40) * 100)}%` }} className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-7" title="Precision Intervention List" subtitle="Categorized registry for targeted teacher-led academic support.">
                    <div className="mb-6 flex gap-2 p-1.5 bg-slate-100 rounded-xl w-fit border border-slate-200 shadow-sm">
                        {['Red', 'Amber', 'Green'].map((tab) => (
                            <button key={tab} onClick={() => setActiveRagTab(tab as any)} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRagTab === tab ? tab === 'Red' ? 'bg-rose-600 text-white shadow-sm' : tab === 'Amber' ? 'bg-amber-500 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                                {tab} ({stats.rag_students?.[tab]?.length || 0})
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                        {(stats.rag_students?.[activeRagTab] || []).map((s: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{s?.name || 'Unknown'}</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s?.id || 'N/A'}</span>
                                </div>
                                <div className="flex gap-8">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Prof.</div>
                                        <div className="text-sm font-extrabold text-slate-800">{s?.avg_score || 0}%</div>
                                    </div>
                                    <div className="text-right border-l border-slate-200 pl-8">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Attendance</div>
                                        <div className="text-sm font-extrabold text-slate-800">{s?.attendance || 0}%</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-12 xl:col-span-5" title="Resiliency Distribution" subtitle="Predictive risk identification based on comprehensive metric density.">
                    <div className="flex flex-col items-center gap-12 py-4">
                        <div className="h-64 w-64 relative">
                            <Doughnut data={ragData} options={{ responsive: true, maintainAspectRatio: false, cutout: '85%', plugins: { legend: { display: false } } }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <Zap className="text-emerald-600 mb-1" size={32} />
                                <span className="text-4xl font-extrabold text-slate-900">
                                    {stats.student_count > 0 ? ((stats.rag_distribution?.Green ?? 0) / stats.student_count * 100).toFixed(0) : 0}%
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center">Batch Resiliency</span>
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}

function MetricCard({ title, value, sub, icon, color }: any) {
    return (
        <motion.div whileHover={{ y: -3 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-[3]">{icon}</div>
            <div className={`p-3 rounded-2xl bg-indigo-50 w-fit mb-6 border border-indigo-100 ${color}`}>{icon}</div>
            <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</h3>
            <div className="flex items-baseline gap-2 mt-4"><span className="text-4xl font-extrabold text-slate-900 leading-none">{value}</span></div>
            <p className="text-slate-500 text-[10px] font-medium mt-2 uppercase tracking-wider">{sub}</p>
        </motion.div>
    );
}

function Card({ children, className, title, subtitle }: any) {
    return (
        <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm ${className}`}>
            <div className="mb-8"><h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-3">{title}</h3><p className="text-slate-500 text-sm font-medium pr-12">{subtitle}</p></div>
            {children}
        </motion.div>
    );
}

function HealthRow({ label, count, color }: any) {
    return (
        <div className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
            <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${color}`}></div><span className="font-bold text-slate-700 uppercase tracking-wider text-xs">{label}</span></div>
            <div className="flex flex-col items-end"><span className="font-extrabold text-slate-900 text-xl">{count || 0}</span><span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Registry</span></div>
        </div>
    );
}
