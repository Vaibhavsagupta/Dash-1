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
import { Radar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
    Award,
    BookOpen,
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
                const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
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

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold text-sm">Loading Deep Analytics...</div>;
    if (!data) return <div className="p-8 text-center text-rose-600 font-bold text-sm">Teacher record not found.</div>;

    const { teacher, breakdown, progression } = data;

    const radarData = {
        labels: ['Improvement', 'Feedback', 'Quality', 'Placement'],
        datasets: [{
            label: 'Performance Mix',
            data: [breakdown.improvement, breakdown.feedback, breakdown.quality, breakdown.conversion],
            backgroundColor: 'rgba(79, 70, 229, 0.18)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2.5,
            pointBackgroundColor: '#4f46e5',
            pointRadius: 4
        }]
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 text-slate-900">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 shadow-sm transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{teacher.name}</h1>
                        <p className="text-indigo-600 font-extrabold uppercase tracking-widest text-xs mt-1">{teacher.subject} Intelligence Detail</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-0.5">TEI Score</span>
                        <span className="text-3xl font-black text-slate-900">{teacher.tei}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Score Breakdown Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-sm"
                >
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-amber-500" /> Professional Effectiveness Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-64 flex justify-center items-center">
                            <Radar
                                data={radarData}
                                options={{
                                    scales: {
                                        r: {
                                            angleLines: { color: 'rgba(148, 163, 184, 0.25)' },
                                            grid: { color: 'rgba(148, 163, 184, 0.25)' },
                                            pointLabels: { color: '#334155', font: { size: 12, weight: 'bold' } },
                                            ticks: { display: false },
                                            suggestedMin: 0, suggestedMax: 100
                                        }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <div className="space-y-5 flex flex-col justify-center">
                            <MetricRow label="Avg Student Improvement" value={`${teacher.avg_improvement}%`} pct={teacher.avg_improvement} color="bg-blue-600" />
                            <MetricRow label="Internal Feedback" value={`${teacher.feedback}/5`} pct={(teacher.feedback / 5) * 100} color="bg-emerald-600" />
                            <MetricRow label="Content Quality" value={`${teacher.quality}/5`} pct={(teacher.quality / 5) * 100} color="bg-amber-500" />
                            <MetricRow label="Placement Conv." value={`${teacher.conversion}%`} pct={teacher.conversion} color="bg-purple-600" />
                        </div>
                    </div>
                </motion.div>

                {/* Pacing Status Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/10"
                >
                    <Target className="absolute -right-8 -bottom-8 opacity-10 text-white" size={200} />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-2xl font-black mb-1 text-white">Pacing Status</h3>
                            <p className="text-xs font-medium text-indigo-100">Monitoring module-wise syllabus completion vs timelines.</p>
                        </div>
                        <div className="my-8">
                            <div className="text-6xl font-black text-white">{teacher.syllabus_completion}%</div>
                            <div className="text-xs font-bold text-indigo-200 mt-2 uppercase tracking-widest">Syllabus Completed</div>
                        </div>
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 text-white">
                            <div className="flex items-center gap-3 text-xs font-black">
                                <Award className="text-amber-300" size={20} />
                                <span>Overall Rating: High-Impact</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Progression Roadmap Log */}
                <div className="lg:col-span-12 bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-600" /> Course Progression Log
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {progression.map((unit: any, i: number) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between group hover:border-indigo-400 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{unit.title}</h4>
                                    {unit.status === 'Completed' ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Zap className="text-amber-500" size={20} />}
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Progress</span>
                                        <span className="text-indigo-600 font-extrabold">{unit.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
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

function MetricRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
    return (
        <div>
            <div className="flex justify-between text-xs font-extrabold mb-1.5">
                <span className="text-slate-600 uppercase tracking-wider text-[10px]">{label}</span>
                <span className="text-slate-900 font-black">{value}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, Math.max(10, pct))}%` }} />
            </div>
        </div>
    );
}
