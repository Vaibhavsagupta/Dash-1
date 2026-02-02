'use client';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
    Chart as ChartJS,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar, Bar, PolarArea, Line } from 'react-chartjs-2';
import {
    Search,
    TrendingUp,
    Award,
    Calendar,
    BarChart2,
    PieChart,
    Activity,
    Zap,
    Target
} from 'lucide-react';

ChartJS.register(
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Tooltip,
    Legend
);

interface StudentAnalytics {
    student_id: string;
    name: string;
    prs_score: number;
    rank: number;
    percentile: number;
    attendance: number;
    dsa: number;
    ml: number;
    qa: number;
    projects: number;
    mock: number;
    pre_score?: number;
    post_score?: number;
    pre_comm: number;
    post_comm: number;
    pre_eng: number;
    post_eng: number;
    pre_knob: number;
    post_knob: number;
    pre_conf: number;
    post_conf: number;
    pre_fluency: number;
    post_fluency: number;
    rag: string;
    rag_history?: { date: string, status: string, period?: string }[];
    assessment_trend?: number[];
}

interface BatchStats {
    dsa: number;
    ml: number;
    qa: number;
    projects: number;
    mock: number;
    pre: number;
    post: number;
}

// 3D Tilt Card Component
const TiltCard = ({ student, batchStats }: { student: StudentAnalytics, batchStats: BatchStats }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'skills' | 'growth' | 'assessments' | 'compare' | 'intelligence' | 'benchmark' | 'rag'>('skills');

    // ... (rest of hte hooks - kept same)
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        const width = currentTarget.clientWidth;
        const height = currentTarget.clientHeight;
        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }
    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }
    const rotateXSpring = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
    const rotateYSpring = useSpring(useMotionValue(0), { stiffness: 300, damping: 30 });
    useEffect(() => {
        return mouseY.on("change", (latest) => rotateXSpring.set(-latest * 20));
    }, [mouseY, rotateXSpring]);
    useEffect(() => {
        return mouseX.on("change", (latest) => rotateYSpring.set(latest * 20));
    }, [mouseX, rotateYSpring]);

    // State for AI Report
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportContent, setReportContent] = useState('');

    // Batch Info State
    const [isBatchOpen, setIsBatchOpen] = useState(false);
    const [batchInfo, setBatchInfo] = useState<any>(null);
    const [batchLoading, setBatchLoading] = useState(false);

    const toggleBatchInfo = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isBatchOpen) {
            setIsBatchOpen(false);
            return;
        }

        setIsBatchOpen(true);
        if (batchInfo) return;

        setBatchLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/analytics/student/${student.student_id}/batch-info`);
            if (res.ok) {
                const data = await res.json();
                setBatchInfo(data);
            }
        } catch (err) {
            console.error("Failed to fetch batch info", err);
        } finally {
            setBatchLoading(false);
        }
    };

    const generateAIReport = async (e: React.MouseEvent) => {
        e.stopPropagation(); setIsReportOpen(true);
        if (reportContent) return; setReportLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API_BASE_URL}/ai/generate-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ student_id: student.student_id })
            });
            if (res.ok) { const data = await res.json(); setReportContent(data.report); } else { setReportContent("Failed to generate report."); }
        } catch (err) { setReportContent("Error connecting to AI service."); } finally { setReportLoading(false); }
    };

    // ... (Chart Data definitions - kept sparse for diff context if needed) ...
    // ... (Charts: radar, growth, assTrend, compare, qualRadar, benchmark) ...
    const radarData = { labels: ['DSA', 'ML', 'QA', 'Projects', 'Mock'], datasets: [{ label: 'Score', data: [student.dsa, student.ml, student.qa, student.projects * 20 > 100 ? student.projects : student.projects * 20, student.mock], backgroundColor: 'rgba(139, 92, 246, 0.4)', borderColor: 'rgba(139, 92, 246, 1)', borderWidth: 2, pointBackgroundColor: 'rgba(139, 92, 246, 1)', pointHoverRadius: 6, }, { label: 'Batch Avg', data: [batchStats.dsa, batchStats.ml, batchStats.qa, batchStats.projects, batchStats.mock], borderColor: 'rgba(148, 163, 184, 0.5)', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, }] };
    const radarOptions = { scales: { r: { beginAtZero: true, max: 100, ticks: { display: false, stepSize: 20 }, pointLabels: { font: { size: 9, weight: 'bold' as const }, color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, angleLines: { color: 'rgba(255, 255, 255, 0.1)' } } }, plugins: { legend: { display: false } }, maintainAspectRatio: false };
    const growthData = { labels: ['Pre-Obs', 'Post-Obs'], datasets: [{ label: 'Student', data: [student.pre_score || 0, student.post_score || 0], backgroundColor: ['#6366f1', '#a855f7'], borderRadius: 4, barThickness: 30, }, { label: 'Batch Avg', data: [batchStats.pre, batchStats.post], backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, barThickness: 30, }] };
    const assessmentTrendData = { labels: (student.assessment_trend || []).map((_, i) => `Ass ${i + 1}`), datasets: [{ label: 'Total Score', data: student.assessment_trend || [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, pointRadius: 4, fill: true }] };
    const compareData = { labels: ['DSA', 'ML', 'QA', 'Mock'], datasets: [{ label: 'Student', data: [student.dsa, student.ml, student.qa, student.mock], backgroundColor: 'rgba(139, 92, 246, 0.8)', borderRadius: 4, }, { label: 'Batch Avg', data: [batchStats.dsa, batchStats.ml, batchStats.qa, batchStats.mock], backgroundColor: 'rgba(148, 163, 184, 0.3)', borderRadius: 4, }] };
    const qualitativeRadarData = { labels: ['Comm.', 'Fluency', 'Engagement', 'Knowledge', 'Confidence'], datasets: [{ label: 'Baseline', data: [student.pre_comm, student.pre_fluency, student.pre_eng, student.pre_knob, student.pre_conf], backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)', borderWidth: 2, pointRadius: 2, }, { label: 'Latest', data: [student.post_comm, student.post_fluency, student.post_eng, student.post_knob, student.post_conf], backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', borderWidth: 3, pointRadius: 3, }] };
    const benchmarkData = { labels: ['DSA', 'ML', 'QA', 'Mock'], datasets: [{ data: [student.dsa, student.ml, student.qa, student.mock], backgroundColor: ['rgba(139, 92, 246, 0.6)', 'rgba(56, 189, 248, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(245, 158, 11, 0.6)',], borderWidth: 0 }] };
    const barOptions = { scales: { y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 9 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } } }, plugins: { legend: { display: false } }, maintainAspectRatio: false, };

    return (
        <motion.div
            onClick={() => router.push(`/admin/student/${student.student_id}`)}
            onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}
            style={{ rotateX: rotateXSpring, rotateY: rotateYSpring, transformStyle: "preserve-3d", cursor: 'pointer' }}
            className="relative group h-[500px] w-full perspective-1000"
        >
            {/* AI Report Modal (kept) */}
            <AnimatePresence>
                {isReportOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { e.stopPropagation(); setIsReportOpen(false); }} className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-2xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                            {/* ... report modal content ... */}
                            <div className="flex justify-between items-start mb-4">
                                <div><h4 className="text-lg font-bold text-white flex items-center gap-2"><div className="p-1 bg-violet-600 rounded-lg"><TrendingUp size={16} /></div>AI Performance Analysis</h4><p className="text-xs text-slate-400 mt-1">Generated for {student.name}</p></div>
                                <button onClick={(e) => { e.stopPropagation(); setIsReportOpen(false); }} className="text-slate-500 hover:text-white p-1"><span className="sr-only">Close</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                            <div className="min-h-[150px] bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed border border-slate-700/50">
                                {reportLoading ? (<div className="flex flex-col items-center justify-center h-32 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div><span className="text-xs text-violet-400 animate-pulse">Analyzing Metrics...</span></div>) : (<>{reportContent.split('\n\n').map((para, i) => (<p key={i} className="mb-3 last:mb-0">{para}</p>))}</>)}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden transform transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-violet-500/20 group-hover:border-violet-500/50">
                {/* Header Pattern */}
                <div className="h-32 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden ring-1 ring-white/10">
                    {/* ... header contents ... */}
                    <button onClick={generateAIReport} className="absolute top-4 left-4 z-20 bg-white/10 hover:bg-white/20 hover:scale-105 backdrop-blur-md p-2 rounded-lg border border-white/10 transition-all group/btn" title="Generate AI Report"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-200 group-hover/btn:text-white"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M12 2a10 10 0 0 1 10 10" /><path d="M2.05 10.5a10 10 0 0 1 9.95-8.5" /></svg></button>
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12"><TrendingUp size={100} color="white" /></div>
                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                        <div className={`px-3 py-1 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${student.rag === 'Red' ? 'bg-rose-500/50' : student.rag === 'Amber' ? 'bg-amber-500/50' : 'bg-emerald-500/50'}`}>{student.rag}</div>
                        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-xs font-bold">Rank #{student.rank}</div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white"><h3 className="text-xl font-bold tracking-tight">{student.name}</h3><p className="text-indigo-200 text-sm font-medium">{student.student_id}</p></div>
                </div>

                {/* Floating Stat Circle */}
                <div className="absolute top-24 right-6 w-16 h-16 bg-slate-800 rounded-full p-1 shadow-lg flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-300 border border-slate-700">
                    <div className="w-full h-full rounded-full border-4 border-violet-500 flex flex-col items-center justify-center bg-slate-800"><span className="text-sm font-bold text-violet-400">{Math.round(student.prs_score)}</span><span className="text-[9px] text-slate-400 font-bold -mt-1">PRS</span></div>
                </div>

                {/* Content Wrapper */}
                <div className="p-5 pt-8 flex flex-col h-[calc(100%-8rem)] justify-between relative bg-slate-800/0">

                    {/* Main Info - Fades out on Hover */}
                    <div className="space-y-4 group-hover:opacity-0 transition-opacity duration-300 absolute inset-x-5 top-8">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-400"><Calendar size={14} /> <span className="text-xs font-semibold">Attendance</span></div>
                                <div className="text-lg font-bold text-slate-200">{student.attendance}%</div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-green-500 h-full rounded-full" style={{ width: `${student.attendance}%` }} /></div>
                            </div>
                            <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-1 text-slate-400"><Award size={14} /> <span className="text-xs font-semibold">Percentile</span></div>
                                <div className="text-lg font-bold text-slate-200">{student.percentile}%</div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{ width: `${student.percentile}%` }} /></div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top Strength</h4>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20"><TrendingUp size={20} /></div>
                                <div><div className="font-bold text-slate-200">{Object.entries({ DSA: student.dsa, ML: student.ml, QA: student.qa, Proj: student.projects }).sort((a, b) => b[1] - a[1])[0][0]}</div><div className="text-xs text-slate-500">Keep it up!</div></div>
                            </div>
                        </div>
                        <div className="flex justify-center pt-8">
                            <button
                                onClick={toggleBatchInfo}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-all group/batch"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest">Batch Info</span>
                                <motion.div animate={{ rotate: isBatchOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </motion.div>
                            </button>
                        </div>
                    </div>

                    {/* Animated Batch Info Dropdown */}
                    <AnimatePresence>
                        {isBatchOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                className="absolute bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 overflow-hidden"
                            >
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-violet-400">Batch Enrollment</h4>
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Active</span>
                                        </div>
                                    </div>

                                    {batchLoading ? (
                                        <div className="py-8 flex flex-col items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">Syncing Records...</span>
                                        </div>
                                    ) : batchInfo ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Batch ID</div>
                                                    <div className="text-sm font-bold text-slate-200">{batchInfo.batch_name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Primary Trainer</div>
                                                    <div className="text-sm font-bold text-slate-200">{batchInfo.trainer}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Duration</div>
                                                    <div className="text-sm font-bold text-slate-200">{batchInfo.duration}</div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Attendance</div>
                                                    <div className="text-sm font-bold text-emerald-400">{batchInfo.attendance}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Cycle Range</div>
                                                    <div className="text-[10px] font-bold text-slate-300">
                                                        {new Date(batchInfo.start_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(batchInfo.end_date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">Assessment Avg</div>
                                                    <div className="text-sm font-bold text-indigo-400">{batchInfo.assessment_avg}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-slate-500 italic">No batch metadata available.</div>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsBatchOpen(false); }}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-slate-700/50"
                                    >
                                        Minimize Details
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Detailed Content - Fades in on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 absolute inset-0 bg-slate-800 flex flex-col h-full z-20 pointer-events-none group-hover:pointer-events-auto rounded-b-2xl overflow-hidden">
                        {/* Tab Headers */}
                        <div className="flex border-b border-slate-700 bg-slate-900/50">
                            {[
                                { id: 'skills', label: 'Skills', icon: PieChart, color: 'violet' },
                                { id: 'growth', label: 'Growth', icon: Activity, color: 'violet' },
                                { id: 'assessments', label: 'Ass.', icon: TrendingUp, color: 'emerald' },
                                { id: 'compare', label: 'vs Batch', icon: BarChart2, color: 'indigo' },
                                { id: 'intelligence', label: 'Soft', icon: Zap, color: 'emerald' },
                                { id: 'benchmark', label: 'Bench', icon: Target, color: 'sky' },
                            ].map((tab) => {
                                const isActive = activeTab === tab.id;
                                const activeClass = tab.color === 'violet' ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5' :
                                    tab.color === 'emerald' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' :
                                        tab.color === 'indigo' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-500/5' :
                                            'text-sky-400 border-b-2 border-sky-400 bg-sky-500/5';
                                return (
                                    <button key={tab.id} onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id as any); }} className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 leading-none ${isActive ? activeClass : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>{tab.label}</button>
                                );
                            })}
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1 p-4 relative">
                            {activeTab === 'skills' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><h4 className="text-[10px] uppercase tracking-wider text-slate-500 text-center mb-1">Competency Profile</h4><div className="flex-1 min-h-0 relative"><Radar data={radarData} options={radarOptions} /></div></motion.div>)}
                            {activeTab === 'growth' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><div className="text-[10px] uppercase tracking-wider text-center mb-1 text-slate-500">Pre vs Post Observation</div><div className="flex-1 min-h-0 relative"><Bar data={growthData} options={barOptions} /></div></motion.div>)}
                            {activeTab === 'assessments' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><div className="text-[10px] uppercase tracking-wider text-center mb-1 text-slate-500 font-bold">Historical Assessment Trend</div><div className="flex-1 min-h-0 relative px-2"><Line data={assessmentTrendData} options={{ ...barOptions, scales: { ...barOptions.scales, y: { ...barOptions.scales.y, max: 400 } } }} /></div></motion.div>)}

                            {activeTab === 'compare' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><div className="text-[10px] uppercase tracking-wider text-center mb-1 text-slate-500">Student vs Batch Average</div><div className="flex-1 min-h-0 relative"><Bar data={compareData} options={barOptions} /></div></motion.div>)}
                            {activeTab === 'intelligence' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><div className="text-[10px] uppercase tracking-widest text-center mb-1 text-slate-500 font-bold">Qualitative Shift Radar</div><div className="flex-1 min-h-0 relative"><Radar data={qualitativeRadarData} options={{ ...radarOptions, scales: { ...radarOptions.scales, r: { ...radarOptions.scales.r, max: 10 } } }} /></div></motion.div>)}
                            {activeTab === 'benchmark' && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full w-full flex flex-col"><h4 className="text-[10px] uppercase tracking-wider text-slate-500 text-center mb-1">Domain Standing</h4><div className="flex-1 min-h-0 relative"><PolarArea data={benchmarkData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } }, plugins: { legend: { display: false } } }} /></div></motion.div>)}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function StudentProgressionList() {
    const [students, setStudents] = useState<StudentAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'rank' | 'prs' | 'name'>('rank');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE_URL}/analytics/students/all`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    cache: 'no-store'
                });
                if (response.ok) {
                    const data = await response.json();
                    setStudents(data);
                } else {
                    console.error('Failed to fetch students:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch students', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const batchStats = useMemo(() => {
        if (!students.length) return { dsa: 0, ml: 0, qa: 0, projects: 0, mock: 0, pre: 0, post: 0 };

        const sum = students.reduce((acc, s) => ({
            dsa: acc.dsa + s.dsa,
            ml: acc.ml + s.ml,
            qa: acc.qa + s.qa,
            projects: acc.projects, // assuming projects score might be missing or raw? s.projects is numeric
            mock: acc.mock + s.mock,
            pre: acc.pre + (s.pre_score || 0),
            post: acc.post + (s.post_score || 0)
        }), { dsa: 0, ml: 0, qa: 0, projects: 0, mock: 0, pre: 0, post: 0 });

        const n = students.length;
        return {
            dsa: Math.round(sum.dsa / n),
            ml: Math.round(sum.ml / n),
            qa: Math.round(sum.qa / n),
            projects: 0, // Mock for now if not used in radar avg
            mock: Math.round(sum.mock / n),
            pre: parseFloat((sum.pre / n).toFixed(1)),
            post: parseFloat((sum.post / n).toFixed(1))
        };
    }, [students]);

    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                s.student_id.toLowerCase().includes(lower)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'rank') return a.rank - b.rank;
            if (sortBy === 'prs') return b.prs_score - a.prs_score;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

        return result;
    }, [students, searchTerm, sortBy]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Controls Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-slate-700 backdrop-blur-sm">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-violet-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all duration-200 sm:text-sm"
                        placeholder="Search students by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400 font-medium hidden md:block">Sort by:</span>
                    <div className="flex bg-slate-700/50 p-1 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setSortBy('rank')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${sortBy === 'rank' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Rank
                        </button>
                        <button
                            onClick={() => setSortBy('prs')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${sortBy === 'prs' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            PRS
                        </button>
                        <button
                            onClick={() => setSortBy('name')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${sortBy === 'name' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Name
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredStudents.map((student) => (
                        <motion.div
                            layout
                            key={student.student_id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TiltCard student={student} batchStats={batchStats} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-20">
                    <div className="mx-auto h-24 w-24 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Search size={40} className="text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-200">No students found</h3>
                    <p className="text-slate-500">Try adjusting your search terms</p>
                </div>
            )}
        </div>
    );
}
