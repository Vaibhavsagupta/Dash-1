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
    RadialLinearScale,
    RadarController,
    ArcElement
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
    Trophy,
    Target,
    Activity,
    Code,
    Book,
    Calendar
} from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    RadarController,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function StudentDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');

        if (!token || role !== 'student') {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/analytics/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading || !data) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const { student, prs_score, rank, percentile, total_students, breakdown } = data;

    // Radar Chart: Skills
    const skillsData = {
        labels: ['DSA', 'ML', 'QA', 'Projects', 'Mock Interview', 'Attendance'],
        datasets: [
            {
                label: 'My Skills',
                data: [
                    breakdown.dsa,
                    breakdown.ml,
                    breakdown.qa,
                    (breakdown.projects / 5) * 100, // Normalize projects to 100 
                    breakdown.mock,
                    breakdown.attendance
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
            },
            {
                label: 'Batch Avg',
                data: [75, 78, 72, 60, 70, 85], // Mock Batch Avg
                backgroundColor: 'rgba(148, 163, 184, 0.1)',
                borderColor: 'rgba(148, 163, 184, 0.4)',
                borderWidth: 1,
                borderDash: [5, 5],
            }
        ],
    };

    // Readiness Gauge (Doughnut)
    const gaugeData = {
        labels: ['Readiness', 'Remaining'],
        datasets: [
            {
                data: [prs_score, 100 - prs_score],
                backgroundColor: [
                    prs_score > 75 ? '#10b981' : prs_score > 50 ? '#f59e0b' : '#ef4444',
                    'rgba(255, 255, 255, 0.1)'
                ],
                borderWidth: 0,
                circumference: 240,
                rotation: 240,
                cutout: '80%',
                borderRadius: 10,
            }
        ]
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-[#0f172a] text-slate-100">
            <nav className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                        Student Portal
                    </h1>
                    <p className="text-slate-400 mt-2">Welcome, {student.name} — <span className="text-emerald-400">Aiming for Excellence</span></p>
                </div>
                <button
                    onClick={() => { localStorage.clear(); router.push('/login'); }}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-all"
                >
                    Logout
                </button>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: PRS & Rank */}
                <div className="space-y-8">

                    {/* PRS Meter */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass p-8 rounded-3xl border border-emerald-900/30 bg-gradient-to-b from-slate-800/80 to-slate-900/80 flex flex-col items-center justify-center relative"
                    >
                        <h2 className="text-slate-400 text-sm font-bold tracking-widest mb-4">PLACEMENT READINESS SCORE</h2>
                        <div className="h-64 w-64 relative flex items-center justify-center">
                            <Doughnut
                                data={gaugeData}
                                options={{
                                    plugins: { legend: { display: false }, tooltip: { enabled: false } }
                                }}
                            />
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-bold text-white">{prs_score}%</span>
                                <span className={`text-sm font-medium ${prs_score > 75 ? 'text-emerald-400' : 'text-amber-400'} mt-1`}>
                                    {prs_score > 75 ? 'Placement Ready' : 'Keep Pushing'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Rank Card */}
                    <div className="glass p-6 rounded-2xl border border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500">
                                <Trophy size={28} />
                            </div>
                            <div>
                                <div className="text-sm text-slate-400">Class Rank</div>
                                <div className="text-2xl font-bold text-white">#{rank} <span className="text-slate-500 text-sm font-normal">/ {total_students}</span></div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Percentile</div>
                            <div className="text-xl font-bold text-emerald-400">{percentile}%</div>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Skills Radar */}
                <div className="lg:col-span-2">
                    <div className="glass p-8 h-full rounded-3xl border border-slate-700 bg-slate-800/50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Target size={20} className="text-emerald-400" /> Skill Proficiency
                            </h2>
                        </div>
                        <div className="h-80 w-full flex items-center justify-center">
                            <Radar
                                data={skillsData}
                                options={{
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            angleLines: { color: 'rgba(255,255,255,0.1)' },
                                            grid: { color: 'rgba(255,255,255,0.1)' },
                                            pointLabels: { color: '#94a3b8', font: { size: 12 } },
                                            ticks: { display: false, backdropColor: 'transparent' }
                                        }
                                    },
                                }}
                            />
                        </div>

                        {/* Scores Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                            <ScorePill label="DSA" score={breakdown.dsa} icon={<Code size={16} />} />
                            <ScorePill label="ML" score={breakdown.ml} icon={<Activity size={16} />} />
                            <ScorePill label="QA" score={breakdown.qa} icon={<Target size={16} />} />
                            <ScorePill label="Projects" score={breakdown.projects} max={5} icon={<Code size={16} />} />
                            <ScorePill label="Mocks" score={breakdown.mock} icon={<MessageSquare size={16} />} />
                            <ScorePill label="Attendance" score={breakdown.attendance} icon={<Calendar size={16} />} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function ScorePill({ label, score, max = 100, icon }: any) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div className={`p-2 rounded-md ${score >= (max * 0.8) ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-700/30'}`}>
                {icon}
            </div>
            <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
                <div className="font-bold text-slate-200">{score} <span className="text-xs text-slate-600">/ {max}</span></div>
            </div>
        </div>
    )
}

function MessageSquare(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    )
}
