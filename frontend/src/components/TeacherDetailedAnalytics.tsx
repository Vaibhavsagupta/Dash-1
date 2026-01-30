'use client';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
    Award,
    BookOpen,
    TrendingUp,
    Star,
    Zap,
    ChevronLeft,
    CheckCircle2,
    Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function TeacherDetailedAnalytics({ teacherId }: { teacherId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API_BASE_URL}/analytics/teacher/${teacherId}/detailed`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [teacherId]);

    if (loading) return <div className="animate-pulse text-slate-500">Loading Deep Analytics...</div>;
    if (!data) return <div className="text-rose-500">Teacher not found.</div>;

    const { teacher, breakdown, progression } = data;

    const radarData = {
        labels: ['Improvement', 'Feedback', 'Quality', 'Placement'],
        datasets: [{
            label: 'Performance Mix',
            data: [breakdown.improvement, breakdown.feedback, breakdown.quality, breakdown.conversion],
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            borderColor: 'rgba(56, 189, 248, 1)',
            borderWidth: 2,
            pointBackgroundColor: '#38bdf8',
        }]
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">{teacher.name}</h1>
                        <p className="text-sky-400 font-bold uppercase tracking-widest text-xs mt-1">{teacher.subject} Intelligence Detail</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-3xl border border-slate-700 flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">TEI Score</span>
                        <span className="text-3xl font-black text-white">{teacher.tei}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Score Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-slate-800/30 backdrop-blur-md rounded-[3rem] border border-slate-700 p-8"
                >
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Zap size={20} className="text-yellow-400" /> Professional Effectiveness Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="h-64 flex justify-center">
                            <Radar
                                data={radarData}
                                options={{
                                    scales: {
                                        r: {
                                            angleLines: { color: 'rgba(255,255,255,0.05)' },
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            pointLabels: { color: '#94a3b8', font: { size: 12, weight: 'bold' } },
                                            ticks: { display: false },
                                            suggestedMin: 0, suggestedMax: 100
                                        }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <div className="space-y-6 flex flex-col justify-center">
                            <MetricRow label="Avg Student Improvement" value={`${teacher.avg_improvement}%`} color="bg-blue-500" />
                            <MetricRow label="Internal Feedback" value={`${teacher.feedback}/5`} color="bg-emerald-500" />
                            <MetricRow label="Content Quality" value={`${teacher.quality}/5`} color="bg-amber-500" />
                            <MetricRow label="Placement Conv." value={`${teacher.conversion}%`} color="bg-purple-500" />
                        </div>
                    </div>
                </motion.div>

                {/* Status Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20"
                >
                    <Target className="absolute -right-8 -bottom-8 opacity-10" size={200} />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-black mb-2">Pacing Status</h3>
                            <p className="opacity-80 text-sm font-medium">Monitoring module-wise syllabus completion vs timelines.</p>
                        </div>
                        <div className="my-10">
                            <div className="text-6xl font-black">{teacher.syllabus_completion}%</div>
                            <div className="text-sm font-semibold opacity-70 mt-2 uppercase tracking-widest">Syllabus Completed</div>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                            <div className="flex items-center gap-3">
                                <Award className="text-yellow-300" />
                                <span className="font-bold">Overall Rating: High-Impact</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Progression Roadmap */}
                <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-[3rem] p-10">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <BookOpen size={20} className="text-sky-400" /> Course Progression Log
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {progression.map((unit: any, i: number) => (
                            <div key={i} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between group hover:border-sky-500/50 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors">{unit.title}</h4>
                                    {unit.status === 'Completed' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Zap className="text-amber-500" size={20} />}
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-sky-400">{unit.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-sky-500 transition-all duration-1000"
                                            style={{ width: `${unit.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricRow({ label, value, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase tracking-widest">{label}</span>
                <span className="text-slate-200">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: '80%' }} />
            </div>
        </div>
    )
}
