"use client";
import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Radar, Line, PolarArea } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Calendar, Zap, AlertCircle, BarChart2, Target, Compass, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface ClassStat {
    avg: number;
    max: number;
    min: number;
}

interface DetailedStats {
    student: {
        student_id: string;
        name: string;
        pre_score: number;
        post_score: number;
        dsa_score: number;
        ml_score: number;
        qa_score: number;
        projects_score: number;
        mock_interview_score: number;
        attendance: number;
        rag_status: string;
        pre_communication: number;
        pre_engagement: number;
        pre_subject_knowledge: number;
        pre_confidence: number;
        pre_fluency: number;
        post_communication: number;
        post_engagement: number;
        post_subject_knowledge: number;
        post_confidence: number;
        post_fluency: number;
        pre_status?: string;
        post_status?: string;
    };
    attendance_history: { date: string, status: string }[];
    class_stats: Record<string, ClassStat>;
    percentiles: Record<string, number>;
    strengths: { subject: string, score: number, diff: number, avg: number }[];
    weaknesses: { subject: string, score: number, diff: number, avg: number }[];
    placement_readiness: number;
    rank: number;
}

export default function StudentDetailedAnalytics({ studentId }: { studentId: string }) {
    const [data, setData] = useState<DetailedStats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/student/${studentId}/detailed`);
                const result = await response.json();
                if (result.student) {
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch student details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    if (loading) return <div className="p-10 text-center text-slate-400">Loading analytics...</div>;
    if (!data) return <div className="p-10 text-center text-red-400">Student not found</div>;

    const { student, class_stats, attendance_history, strengths, weaknesses, percentiles } = data;

    // 1. Subject-wise Pre vs Post Observation comparison
    const prePostData = {
        labels: ['Comm.', 'Engage', 'Knowledge', 'Conf.', 'Fluency'],
        datasets: [
            {
                label: 'Pre-Observation',
                data: [
                    student.pre_communication || 0,
                    student.pre_engagement || 0,
                    student.pre_subject_knowledge || 0,
                    student.pre_confidence || 0,
                    student.pre_fluency || 0
                ],
                backgroundColor: 'rgba(99, 102, 241, 0.8)', // Violet-Indigo
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(99, 102, 241, 1)',
            },
            {
                label: 'Post-Observation',
                data: [
                    student.post_communication || 0,
                    student.post_engagement || 0,
                    student.post_subject_knowledge || 0,
                    student.post_confidence || 0,
                    student.post_fluency || 0
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 1)',
            }
        ]
    };

    // 2. Subject Scores comparison with Class High and Avg
    const subjects = ['dsa_score', 'ml_score', 'qa_score', 'projects_score', 'mock_interview_score'];
    const subjectLabels = ['DSA', 'ML', 'QA/Logic', 'Projects', 'Mock Interview'];

    const subjectData = {
        labels: subjectLabels,
        datasets: [
            {
                label: 'Student Score',
                data: subjects.map(s => (student as any)[s] || 0),
                backgroundColor: 'rgba(139, 92, 246, 0.8)', // Violet
                borderRadius: 4,
            },
            {
                label: 'Batch Avg',
                data: subjects.map(s => class_stats[s]?.avg || 0),
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 4,
            },
            {
                label: 'Batch High',
                data: subjects.map(s => class_stats[s]?.max || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.3)', // Green
                borderRadius: 4,
            }
        ]
    };

    // 3. Attendance Trend
    const attTrendData = {
        labels: attendance_history.map(h => h.date),
        datasets: [{
            label: 'Attendance Status',
            data: attendance_history.map(h => h.status === 'Present' ? 1 : 0),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
        }]
    };

    // 4. Intelligence Radar (Qualitative Skills)
    const radarData = {
        labels: ['Communication', 'Fluency', 'Engagement', 'Subject Knowledge', 'Confidence'],
        datasets: [
            {
                label: 'Baseline (Pre)',
                data: [student.pre_communication, student.pre_fluency, student.pre_engagement, student.pre_subject_knowledge, student.pre_confidence],
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                borderColor: '#6366f1',
                borderWidth: 2,
            },
            {
                label: 'Current (Post)',
                data: [student.post_communication, student.post_fluency, student.post_engagement, student.post_subject_knowledge, student.post_confidence],
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: '#10b981',
                borderWidth: 3,
            }
        ]
    };

    // 5. Polar Benchmarking (Percentiles)
    const polarData = {
        labels: ['DSA', 'ML', 'QA', 'Projects', 'Mock'],
        datasets: [{
            label: 'Percentile Rank',
            data: [
                percentiles.dsa_score || 0,
                percentiles.ml_score || 0,
                percentiles.qa_score || 0,
                percentiles.projects_score || 0,
                percentiles.mock_interview_score || 0
            ],
            backgroundColor: [
                'rgba(139, 92, 246, 0.6)',
                'rgba(56, 189, 248, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(245, 158, 11, 0.6)',
                'rgba(239, 68, 68, 0.6)',
            ],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all group"
                    >
                        <ArrowLeft className="text-slate-400 group-hover:text-white" size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{student.name}</h1>
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                            ID: {student.student_id} •
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${student.rag_status === 'Red' ? 'bg-red-500/20 text-red-400' : student.rag_status === 'Amber' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                {student.rag_status} Status
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-8 text-center bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Attendance</div>
                        <div className="text-2xl font-bold text-white">{student.attendance}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Score</div>
                        <div className="text-2xl font-bold text-indigo-400">
                            {Math.round((student.dsa_score + student.ml_score + student.qa_score + student.mock_interview_score) / 4)}
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pre-Obs</div>
                        <div className="text-2xl font-bold text-slate-300">{student.pre_score}</div>
                    </div>
                </div>
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-400" />
                            <h2 className="text-lg font-bold text-white">Observation Growth</h2>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Pre vs Post Shift</div>
                    </div>
                    <div className="h-72">
                        <Bar
                            data={prePostData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10,
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        ticks: { color: '#64748b', font: { size: 10 } }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#94a3b8',
                                            padding: 20,
                                            usePointStyle: true,
                                            font: { size: 11, weight: 600 }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 justify-between">
                        <div className="flex items-center gap-2">
                            <BarChart2 size={20} className="text-violet-400" />
                            <h2 className="text-lg font-bold text-white">Subject Assessment</h2>
                        </div>
                        <div className="text-xs text-slate-500">Marks Distribution</div>
                    </div>
                    <div className="h-72">
                        <Bar
                            data={subjectData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                                    x: { grid: { display: false } }
                                },
                                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Qualitative Intelligence & Resiliency */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-indigo-500/20 rounded-xl"><Zap className="text-indigo-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Qualitative Intelligence mapping</h2>
                            <p className="text-xs text-slate-500">Individual behavioral intelligence (Baseline vs Target).</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <Radar
                            data={radarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    r: {
                                        angleLines: { color: 'rgba(255,255,255,0.05)' },
                                        grid: { color: 'rgba(255,255,255,0.05)' },
                                        pointLabels: { color: '#94a3b8', font: { size: 11, weight: 600 } },
                                        ticks: { display: false },
                                        suggestedMin: 0,
                                        suggestedMax: 10
                                    }
                                },
                                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-6 border-4 ${student.rag_status === 'Red' ? 'border-rose-500/20 bg-rose-500/10 text-rose-500' : student.rag_status === 'Amber' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Resiliency Status</h3>
                    <div className="text-5xl font-black text-white mb-2">{student.rag_status}</div>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest max-w-[200px]">
                        Individual risk density calculated via attendance and subject proficiency.
                    </p>
                    <div className="mt-8 w-full space-y-3 px-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Growth Velocity</span>
                            <span className="text-emerald-400 font-black">+{((student.post_score - (student.pre_score || 0)) / (student.pre_score || 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: '75%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Intelligence Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-violet-500/20 rounded-xl"><Target className="text-violet-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Percentile Benchmark</h2>
                            <p className="text-xs text-slate-500">Whole-batch standing.</p>
                        </div>
                    </div>
                    <div className="h-64 flex justify-center">
                        <PolarArea
                            data={polarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } } },
                                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-[#1e293b]/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-45"><Zap size={120} /></div>
                    <div className="z-10 w-full">
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Placement Readiness Index</h3>
                        <div className="text-7xl font-black text-indigo-400 mb-2">{data.placement_readiness}%</div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-4 border border-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${data.placement_readiness}%` }}
                                className={`h-full bg-gradient-to-r ${data.placement_readiness > 80 ? 'from-emerald-500 to-sky-400' : 'from-indigo-500 to-violet-400'}`}
                            />
                        </div>
                        <p className="text-slate-400 text-xs mt-6 px-4 leading-relaxed italic">
                            AI-weighted score based on domain proficiency and mock performance.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-8 rounded-[3rem] border border-slate-700 backdrop-blur-md flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-emerald-500/20 rounded-xl"><Compass className="text-emerald-400" size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Transformation Roadmap</h2>
                            <p className="text-xs text-slate-500">Qualitative shift from intake.</p>
                        </div>
                    </div>
                    <div className="flex-grow space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-700">
                        <div className="relative pl-10">
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center border-4 border-slate-900 z-10"><span className="text-[10px] font-black">1</span></div>
                            <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Baseline Assessment</div>
                            <div className="text-sm font-bold text-slate-200">Pre-Status: <span className="text-indigo-400 uppercase">{student.pre_status || 'N/A'}</span></div>
                        </div>
                        <div className="relative pl-10">
                            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-slate-900 z-10 ${student.post_status ? 'bg-emerald-500' : 'bg-slate-700'}`}><Zap size={10} className="text-white" /></div>
                            <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Latest Achievement</div>
                            <div className="text-sm font-bold text-slate-200">Post-Status: <span className="text-emerald-400 uppercase">{student.post_status || 'Pending'}</span></div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                                <div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Batch Rank</div>
                                    <div className="text-xl font-black text-white">#{data.rank}</div>
                                </div>
                                <ShieldCheck size={28} className="text-emerald-500/40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis & Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-slate-800/50 p-6 rounded-2xl border border-green-900/30 bg-gradient-to-br from-slate-800 to-green-900/10"
                >
                    <h3 className="text-md font-bold text-green-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <TrendingUp size={18} /> Areas of Strength
                    </h3>
                    {strengths.length > 0 ? (
                        <div className="space-y-4">
                            {strengths.map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-700/50">
                                    <div>
                                        <div className="text-slate-200 font-bold capitalize">{s.subject}</div>
                                        <div className="text-xs text-slate-500">Batch Avg: {s.avg}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-green-400">{s.score}</div>
                                        <div className="text-xs font-bold text-green-500/70">+{s.diff} above avg</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 italic">No specific strengths identified.</div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 p-6 rounded-2xl border border-red-900/30 bg-gradient-to-br from-slate-800 to-red-900/10 flex flex-col"
                >
                    <h3 className="text-md font-bold text-red-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <AlertCircle size={18} /> Areas for Improvement
                    </h3>
                    <div className="space-y-6 flex-grow">
                        {weaknesses.length > 0 ? (
                            <div className="space-y-4">
                                {weaknesses.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-xl border border-slate-700/50">
                                        <div>
                                            <div className="text-slate-200 font-bold capitalize">{s.subject}</div>
                                            <div className="text-xs text-slate-500">Batch Avg: {s.avg}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-red-400">{s.score}</div>
                                            <div className="text-xs font-bold text-red-500/70">{s.diff} below avg</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-slate-500 italic text-sm">No critical drops.</div>
                        )}
                        {(student.pre_status || student.post_status) && (
                            <div className="pt-4 border-t border-slate-700/50">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Behavioral Observations</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                                        <div className="text-[8px] uppercase mb-1">Initial</div> {student.pre_status}
                                    </div>
                                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-emerald-400">
                                        <div className="text-[8px] uppercase mb-1">Latest</div> {student.post_status}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Percentile Strip */}
            <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 flex flex-wrap gap-4 justify-center">
                {Object.entries(percentiles).map(([key, val]) => (
                    <div key={key} className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="text-xs text-slate-500 uppercase">{key.replace('_score', '').replace('_', ' ')}</div>
                        <div className="text-lg font-bold text-violet-300">{val} <span className="text-xs text-slate-600">%ile</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
