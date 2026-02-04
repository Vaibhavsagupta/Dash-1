"use client";
import { API_BASE_URL } from '@/lib/api';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, AlertTriangle, UploadCloud, Calendar, Clock, PlayCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import styles from './dashboard.module.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [agenda, setAgenda] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState('All');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (!token || role !== 'admin') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch stats and agenda in parallel
                const [statsRes, agendaRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/analytics/dashboard/admin?batch_filter=${selectedBatch}`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-store'
                    }),
                    fetch(`${API_BASE_URL}/dashboard/training-agenda`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-store'
                    })
                ]);

                if (statsRes.ok) {
                    setData(await statsRes.json());
                }
                if (agendaRes.ok) {
                    setAgenda(await agendaRes.json());
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router, selectedBatch]);

    if (loading || !data) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Derived Metrics
    const totalStudents = data.total_students;
    const avgPrs = data.top_students.reduce((acc: any, curr: any) => acc + curr.prs, 0) / data.top_students.length;
    // Determine risk students (simplified logic: implied < 70 PRS is risk, but for now we just show a count based on real data would be better)
    // Since we only get top 5, we can't calculate exact risk. We'll use a placeholder or derived if we fetched all.
    // For this mock display:
    const riskCount = Math.floor(totalStudents * 0.15); // mock 15% at risk

    // Placement Funnel Data
    const funnelData = {
        labels: ['Total Students', 'Eligible (>70% PRS)', 'Interviewed', 'Placed'],
        datasets: [
            {
                label: '# of Students',
                data: [totalStudents, Math.floor(totalStudents * 0.8), Math.floor(totalStudents * 0.6), Math.floor(totalStudents * 0.4)],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                    'rgba(236, 72, 153, 0.6)',
                    'rgba(34, 197, 94, 0.6)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(34, 197, 94, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Trainer Performance Data
    const trainerLabels = data.teacher_performance.map((t: any) => t.subject);
    const trainerScores = data.teacher_performance.map((t: any) => t.tei);

    const trainerChartData = {
        labels: trainerLabels,
        datasets: [
            {
                label: 'Teacher Effectiveness Index (TEI)',
                data: trainerScores,
                backgroundColor: 'rgba(56, 189, 248, 0.7)',
                borderRadius: 8,
            }
        ]
    };

    return (
        <div className="text-slate-100">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Admin Control Center
                    </h1>
                    <p className="text-slate-400 mt-2">Real-time batch readiness and faculty analytics</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    {['All', 'Batch 1', 'Batch 2', 'Batch 3'].map((b) => (
                        <button
                            key={b}
                            onClick={() => setSelectedBatch(b)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedBatch === b ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                        >
                            {b}
                        </button>
                    ))}
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <KPICard
                    title="Total Students"
                    value={totalStudents}
                    icon={<Users size={24} className="text-blue-400" />}
                    trend="+12% vs last batch"
                />
                <KPICard
                    title="Avg Batch PRS"
                    value={`${avgPrs.toFixed(1)}%`}
                    icon={<GraduationCap size={24} className="text-purple-400" />}
                    trend="Strong Readiness"
                />
                <KPICard
                    title="Placement Rate"
                    value="40%"
                    icon={<TrendingUp size={24} className="text-green-400" />}
                    trend="On Track"
                />
                <KPICard
                    title="At Risk"
                    value={riskCount}
                    icon={<AlertTriangle size={24} className="text-red-400" />}
                    trend="Needs Attention"
                    isRisk
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
                {/* Placement Funnel */}
                <div className="glass p-6 rounded-2xl lg:col-span-2 border border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-400" /> Placement Funnel
                    </h2>
                    <div className="h-64 flex items-center justify-center">
                        <Bar
                            data={funnelData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Top Students */}
                <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <GraduationCap size={20} className="text-purple-400" /> Top Performers
                    </h2>
                    <div className="space-y-4">
                        {data.top_students.map((student: any, i: number) => (
                            <div key={`top-student-${student.id}-${i}`} className="flex justify-between items-center p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                        i === 1 ? 'bg-gray-400/20 text-gray-400' :
                                            'bg-orange-700/20 text-orange-700'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <span className="font-medium text-slate-200">{student.name}</span>
                                </div>
                                <span className="font-bold text-indigo-400">{student.prs}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Faculty Performance */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-slate-200">Faculty Performance Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Chart */}
                    <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold mb-4 text-slate-300">TEI Comparison</h3>
                        <div className="h-64">
                            <Bar
                                data={trainerChartData}
                                options={{
                                    indexAxis: 'y' as const,
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                                        y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.teacher_performance.map((teacher: any, i: number) => (
                            <motion.div
                                key={`teacher-${teacher.id || i}-${i}`}
                                whileHover={{ y: -5, scale: 1.02 }}
                                onClick={() => router.push(`/admin/teacher/${teacher.id}`)}
                                className="p-5 rounded-xl border border-slate-700 bg-slate-800/80 flex flex-col justify-between cursor-pointer group hover:border-sky-500/50 transition-all"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors">{teacher.name}</h4>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                            {teacher.subject}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-400">Effectiveness Score</div>
                                </div>
                                <div className="mt-4 flex items-end justify-between">
                                    <span className="text-3xl font-bold text-sky-400">{teacher.tei}</span>
                                    <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                            style={{ width: `${teacher.tei}%` }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Training Agenda Section */}
            <div className="mt-12 mb-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-200">Training Agenda</h2>
                        <p className="text-sm text-slate-500">Scheduled modules and delivery pipeline</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 uppercase">
                            <CheckCircle2 size={12} /> {agenda.filter(a => a.status === 'Completed').length} Completed
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded border border-indigo-400/20 uppercase">
                            <PlayCircle size={12} /> {agenda.filter(a => a.status === 'Live').length} Live
                        </span>
                    </div>
                </div>

                <div className="glass overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-800/40 backdrop-blur-md shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900/50 border-b border-slate-700">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Module Topic</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Scheduled Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Lead Trainer</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Current Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Batch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {agenda.length > 0 ? (
                                    agenda.map((item, i) => (
                                        <tr key={item.id || i} className="group hover:bg-slate-700/20 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                                                        <Calendar size={18} className="text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{item.title}</div>
                                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                                            <Clock size={10} /> {item.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-medium text-slate-300">
                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                        {item.trainer.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-300">{item.trainer}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                    item.status === 'Live' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-pulse' :
                                                        'bg-slate-700/50 border-slate-600 text-slate-400'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{item.batch || 'Global'}</div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Calendar size={48} className="text-slate-500" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No training modules scheduled</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, trend, isRisk = false }: { title: string, value: any, icon: any, trend: string, isRisk?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${isRisk ? 'border-red-900/30 bg-red-900/10' : 'border-slate-700 bg-slate-800/50'} backdrop-blur-sm`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${isRisk ? 'bg-red-500/20' : 'bg-slate-700/50'}`}>
                    {icon}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${isRisk ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {trend}
                </span>
            </div>
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
        </motion.div>
    );
}
